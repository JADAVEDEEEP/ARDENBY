'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      // Above every modal/drawer on the site (quick view is z-[9950]).
      style={{ zIndex: 9999 }}
      duration={2600}
      toastOptions={{
        classNames: {
          toast:
            'group toast !w-auto !min-w-[260px] !max-w-[340px] !gap-3 !rounded-[10px] !border !border-[#C6A75E]/35 !border-l-2 !border-l-[#C6A75E] !bg-[#05221A] !px-4 !py-3 !text-[#F3F0E6] !shadow-[0_12px_32px_-12px_rgba(0,0,0,0.7)] [&_[data-icon]]:!text-[#34C48B]',
          title: '!text-[13px] !font-semibold !tracking-wide !text-[#E7D3A0]',
          description: '!line-clamp-1 !text-[12.5px] !text-[#D5DDD6]',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
