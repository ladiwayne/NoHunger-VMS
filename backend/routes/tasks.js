const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requirePermission = require('../middleware/permission');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { logAudit } = require('../utils/auditLogger');

// Create task
router.post('/', requirePermission('manage_tasks'), [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)'),
  body('description').optional().trim().isLength({ max: 1000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  try {
    const { title, description, assignedTo, activityId, eventId, priority, dueDate } = req.body;

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.user.id,
      activityId,
      eventId,
      priority,
      dueDate,
    });

    await task.save();
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'create_task',
      entityType: 'Task',
      entityId: task._id,
      details: { title: task.title, assignedTo: task.assignedTo },
    });

    // Create a notification for the assigned volunteer (if any)
    if (task.assignedTo) {
      try {
        await Notification.create({
          userId: task.assignedTo,
          type: 'task',
          title: 'New Task Assigned',
          message: `You have been assigned a new task: "${task.title}"`,
          relatedId: task._id,
          read: false,
        });
      } catch (notifyErr) {
        console.error('[tasks] Failed to create assignment notification:', notifyErr?.message || notifyErr);
      }
    }

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
});

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email')
      .populate('activityId', 'title')
      .populate('eventId', 'title');
    
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// Get tasks assigned to volunteer
router.get('/assigned-to-me', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate('assignedBy', 'firstName lastName email')
      .populate('activityId', 'title')
      .populate('eventId', 'title');
    
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// Update task status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
    }

    await task.save();

    res.status(200).json({
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
});

// Full task update (admin)
router.put('/:id', requirePermission('manage_tasks'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, description, assignedTo, activityId, eventId, priority, dueDate, status } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (activityId !== undefined) task.activityId = activityId;
    if (eventId !== undefined) task.eventId = eventId;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (status !== undefined) task.status = status;
    if (status === 'completed' && !task.completedAt) {
      task.completedAt = new Date();
    }

    await task.save();
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'update_task',
      entityType: 'Task',
      entityId: task._id,
      details: { title: task.title, status: task.status },
    });
    res.status(200).json({ message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
});

// Delete task (admin)
router.delete('/:id', requirePermission('manage_tasks'), async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'delete_task',
      entityType: 'Task',
      entityId: task._id,
      details: { title: task.title },
    });
    res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
});

module.exports = router;
