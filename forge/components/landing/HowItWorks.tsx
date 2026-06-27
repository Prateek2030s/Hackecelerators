const steps = [
  { title: 'Connect', description: 'Founder pastes a GitHub repo URL' },
  { title: 'Generate', description: 'AI creates scoped engineering tasks' },
  { title: 'Build', description: 'Students code solutions in a guided workspace' },
  { title: 'Review', description: 'AI evaluates and surfaces top submissions' },
];

export function HowItWorks() {
  return (
    <section className="px-4 py-24 md:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-heading mb-16 text-center text-3xl font-bold text-zinc-50 md:text-4xl">
          How It Works
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="relative flex flex-col items-center text-center">
              {index < steps.length - 1 && (
                <div className="absolute top-6 hidden h-0.5 w-full bg-zinc-800 md:block md:translate-x-1/2" />
              )}
              <div className="relative z-10 flex size-12 items-center justify-center rounded-full border border-amber-500/30 bg-zinc-900 font-heading text-lg font-bold text-amber-500">
                {index + 1}
              </div>
              <h3 className="font-heading mt-4 text-lg font-semibold text-zinc-50">{step.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
