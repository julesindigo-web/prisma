export function Footer({ variant }: { variant: 'internal' | 'report' }) {
  if (variant === 'report') {
    return (
      <p className="text-center text-[9px] text-graphite/50">
        Dokumen dihasilkan PRISMA • dirancang oleh Priastama Adiyoga
      </p>
    );
  }
  return (
    <footer className="flex items-center justify-between border-t border-graphite/10 px-4 py-2 text-[10px] text-graphite/30 md:px-6">
      <span>PRISMA Safety Management System</span>
      <span className="prisma-monogram">PA</span>
    </footer>
  );
}
