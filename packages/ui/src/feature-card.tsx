type FeatureCardProps = {
  title: string;
};

export function FeatureCard({ title }: FeatureCardProps) {
  return (
    <div className="rounded-[24px] border border-white/80 bg-white/75 p-5 shadow-panel backdrop-blur">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-pine text-sm font-semibold text-white">
        AI
      </div>
      <p className="text-base font-medium leading-7 text-slate-700">{title}</p>
    </div>
  );
}

