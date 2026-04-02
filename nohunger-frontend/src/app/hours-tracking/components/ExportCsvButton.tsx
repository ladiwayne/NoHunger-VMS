'use client';

export default function ExportCsvButton() {
  return (
    <a
      href="#export"
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white
        font-600 text-[13.5px] hover:bg-primary-dark active:scale-[0.98]
        transition-all duration-150 shadow-sm"
      onClick={(e) => {
        e?.preventDefault();
        // TODO: Backend — GET /api/volunteers/:id/hours/export?format=csv
        import('sonner')?.then(({ toast }) => {
          toast?.success('Exporting your hours log as CSV…', { duration: 3000 });
        });
      }}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Export CSV
    </a>
  );
}
