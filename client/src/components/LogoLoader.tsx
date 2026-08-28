import logoImg from '@/logo.png';

interface LogoLoaderProps {
  fullScreen?: boolean;
  className?: string;
}

export default function LogoLoader({ fullScreen = false, className = '' }: LogoLoaderProps) {
  return (
    <div
      role="status"
      aria-label="İçerik hazırlanıyor"
      className={`${fullScreen ? 'fixed inset-0 z-[999] min-h-[100dvh]' : 'min-h-[280px] w-full'} flex items-center justify-center bg-[#020617] ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 scale-150 animate-pulse rounded-full bg-blue-500/30 blur-3xl" />
        <img
          src={logoImg}
          alt=""
          aria-hidden="true"
          className="relative z-10 h-24 w-24 animate-spin object-contain drop-shadow-2xl"
          style={{ animationDuration: '3s' }}
        />
      </div>
    </div>
  );
}
