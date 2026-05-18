'use client';

import { useState } from 'react';
import { Phone, Mail, MessageCircle, ExternalLink } from 'lucide-react';
import AppLayout from '@/components/AppLayout';

export default function ContactPage() {
  const [activeTab, setActiveTab] = useState<'support' | 'contact'>('support');

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-700 text-foreground mb-2">Contact & Support</h1>
          <p className="text-muted-foreground">
            Get in touch with the No Hunger Initiatives team for support and inquiries.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2 rounded-lg text-sm font-600 transition-all ${
              activeTab === 'support'
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Support Channels
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-4 py-2 rounded-lg text-sm font-600 transition-all ${
              activeTab === 'contact'
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Contact Info
          </button>
        </div>

        {activeTab === 'support' && (
          <div className="space-y-6">
            {/* WhatsApp Groups */}
            <div className="bg-white border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-600 text-foreground">WhatsApp Community Groups</h3>
                  <p className="text-sm text-muted-foreground">Join our active community discussions</p>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href="https://chat.whatsapp.com/F80Iw5xQtxYJxwhIYDIv8W?mode=gi_c"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
                >
                  <div>
                    <p className="font-600 text-foreground">No Hunger Champions WhatsApp Group</p>
                    <p className="text-sm text-muted-foreground">Join to find out about the latest news and ways to get involved</p>
                  </div>
                  <ExternalLink size={16} className="text-muted-foreground group-hover:text-foreground" />
                </a>

                <a
                  href="https://whatsapp.com/channel/0029VbBxio1K5cDJBmQVbd1P"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
                >
                  <div>
                    <p className="font-600 text-foreground">No Hunger Initiatives WhatsApp Channel</p>
                    <p className="text-sm text-muted-foreground">Get more news and learn how we can reach our goal together</p>
                  </div>
                  <ExternalLink size={16} className="text-muted-foreground group-hover:text-foreground" />
                </a>
              </div>
            </div>

            {/* Website */}
            <div className="bg-white border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <ExternalLink size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-600 text-foreground">Official Website</h3>
                  <p className="text-sm text-muted-foreground">Visit our website for more information</p>
                </div>
              </div>

              <a
                href="https://www.nohungerfoodbank.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Visit Website
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-600 text-foreground mb-4">Contact Information</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageCircle size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-600 text-foreground">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">+234 916 276 8387 | +234 913 852 4271</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-600 text-foreground">Call</p>
                    <p className="text-sm text-muted-foreground">+234 706 387 5444 | +234 704 886 7678</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Mail size={18} className="text-red-600" />
                  </div>
                  <div>
                    <p className="font-600 text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">info@nohungerfoodbank.org, gbadebo.odularu@nohungerfoodbank.org</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Office Address */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-600 text-foreground mb-4">Office Address</h3>
              <div className="text-sm text-muted-foreground">
                <p>No Hunger Initiatives Nigeria</p>
                <p>Corporate 14, Dubai-Abuja International Market, Behind Games Village, Kaura, Abuja, Nigeria</p>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-600 text-foreground mb-4">Follow Us</h3>
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="https://www.facebook.com/nohunger.foodbank.5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
                >
                  <ExternalLink size={20} className="text-blue-600" />
                  <span className="text-sm font-600 text-foreground">Facebook</span>
                </a>

                <a
                  href="https://www.instagram.com/nohungerfoodbank/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
                >
                  <ExternalLink size={20} className="text-pink-600" />
                  <span className="text-sm font-600 text-foreground">Instagram</span>
                </a>

                <a
                  href="http://x.com/nfoodbank/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
                >
                  <ExternalLink size={20} className="text-gray-600" />
                  <span className="text-sm font-600 text-foreground">X (Twitter)</span>
                </a>

                <a
                  href="https://www.linkedin.com/in/no-hunger-foodbank-b802051a9/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
                >
                  <ExternalLink size={20} className="text-blue-700" />
                  <span className="text-sm font-600 text-foreground">LinkedIn</span>
                </a>

                <a
                  href="https://www.youtube.com/channel/UCqdWkgY1x8nzliHfXV6WeCw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group col-span-2"
                >
                  <ExternalLink size={20} className="text-red-600" />
                  <span className="text-sm font-600 text-foreground">YouTube</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}