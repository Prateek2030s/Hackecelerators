import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: '🔍',
    title: 'AI Repository Abstraction',
    description:
      'Your codebase stays private. Our AI creates a safe, simplified workspace with only the context students need.',
  },
  {
    icon: '🎯',
    title: 'Smart Task Generation',
    description:
      'AI analyzes your repo and generates structured engineering tasks aligned with your business logic and tech stack.',
  },
  {
    icon: '🤖',
    title: 'Automated Code Review',
    description:
      'Every submission is evaluated for correctness, security, scalability, and code quality before it reaches you.',
  },
];

export function Features() {
  return (
    <section className="px-4 py-24 md:px-8 lg:px-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="rounded-xl border-zinc-800 bg-zinc-900 transition-colors hover:border-amber-500/30"
          >
            <CardHeader>
              <span className="text-3xl">{feature.icon}</span>
              <CardTitle className="font-heading text-lg text-zinc-50">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
