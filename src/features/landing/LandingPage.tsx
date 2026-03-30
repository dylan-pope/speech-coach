import { motion } from 'framer-motion'
import { ArrowRight, Clock4, Flag, Sparkles, Target, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppFrame } from '../../components/layout/AppFrame'
import { NeoButton } from '../../components/ui/NeoButton'
import { NeoCard } from '../../components/ui/NeoCard'
import { APP_MODE, IS_DEMO_MODE } from '../../lib/constants'
import { formatDateTime } from '../../lib/formatters'
import { seededPrompts } from '../../mocks/prompts'
import { useLocalSessions } from '../../hooks/useLocalSessions'

const roadmapItems = [
  'Delivery coaching (pace, filler words, confidence)',
  'Saved class rosters',
  'Teacher dashboard',
  'Side-by-side progress over time',
  'Audio upload review',
  'Rubric export',
  'Multiplayer debate mode',
]

const cardMotion = {
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.35 },
} as const

export function LandingPage() {
  const { sessions } = useLocalSessions()
  const recentSessions = sessions.slice(0, 4)

  return (
    <AppFrame className="space-y-8 md:space-y-12">
      <section className="grid gap-5 md:grid-cols-[1.6fr_1fr]">
        <motion.div {...cardMotion}>
          <NeoCard accent="red" className="space-y-5 p-6 md:p-8">
            <p className="inline-flex border-2 border-ink bg-lime px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em]">
              Low-Stakes AI Practice
            </p>
            <h1 className="text-4xl uppercase leading-[0.9] md:text-6xl">
              Build stronger arguments. Practice rebuttals. Get instant coaching.
            </h1>
            <p className="max-w-3xl text-base md:text-lg">
              Civic Debate Academy is a practice gym for speech and debate students.
              Record your claim, pressure-test it against counterpoints, and finish each round
              with clear next reps.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/practice">
                <NeoButton className="min-w-48">
                  Start Practicing
                  <ArrowRight className="size-4" />
                </NeoButton>
              </Link>
              <Link to="/practice">
                <NeoButton className="min-w-48" variant="secondary">
                  View Demo Flow
                </NeoButton>
              </Link>
            </div>
          </NeoCard>
        </motion.div>

        <motion.div {...cardMotion} transition={{ duration: 0.35, delay: 0.08 }}>
          <NeoCard accent="blue" className="h-full space-y-4 p-6">
            <h2 className="text-xl uppercase">Prototype Mode</h2>
            <p className="text-sm">
              Current frontend mode:
              <span className="ml-2 border-2 border-ink bg-paper px-2 py-0.5 font-semibold uppercase">
                {APP_MODE}
              </span>
            </p>
            {IS_DEMO_MODE ? (
              <p className="border-2 border-ink bg-orange-argument p-3 text-sm font-semibold">
                Demo mode enabled. AI responses are mocked for static deployment.
              </p>
            ) : (
              <p className="border-2 border-ink bg-teal-coach/20 p-3 text-sm">
                Full-local mode is active. Use the local Express server and Ollama for live
                coaching responses.
              </p>
            )}
            <div className="space-y-2 text-sm">
              <p className="font-semibold uppercase">Sample Prompt Pool</p>
              <ul className="space-y-2">
                {seededPrompts.slice(0, 3).map((prompt) => (
                  <li className="border-2 border-ink bg-paper p-2" key={prompt.id}>
                    {prompt.title}
                  </li>
                ))}
              </ul>
            </div>
          </NeoCard>
        </motion.div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {[
          {
            icon: <Target className="size-5" />,
            title: 'How it works',
            copy: 'Choose a claim prompt, record your opening, then revise your argument with targeted coaching.',
            accent: 'orange' as const,
          },
          {
            icon: <Flag className="size-5" />,
            title: 'Rebuttal drill',
            copy: 'Get two counterpoints, pick one, and practice direct refutation before your final summary.',
            accent: 'teal' as const,
          },
          {
            icon: <Sparkles className="size-5" />,
            title: 'Why this matters',
            copy: 'Students can get fast argument reps without waiting on teacher review between class meetings.',
            accent: 'blue' as const,
          },
        ].map((card, index) => (
          <motion.div
            key={card.title}
            {...cardMotion}
            transition={{ duration: 0.3, delay: 0.06 * index }}
          >
            <NeoCard accent={card.accent} className="h-full space-y-3">
              <p className="inline-flex items-center gap-2 border-2 border-ink bg-paper px-2 py-1 text-xs font-semibold uppercase">
                {card.icon}
                {card.title}
              </p>
              <p>{card.copy}</p>
            </NeoCard>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
        <motion.div {...cardMotion}>
          <NeoCard accent="lime" className="space-y-4">
            <h2 className="text-2xl uppercase">Recent Sessions</h2>
            {recentSessions.length === 0 ? (
              <p className="border-2 border-ink bg-paper p-3">
                No sessions yet. Run one practice round and your recap history will appear here.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentSessions.map((session) => (
                  <li className="border-3 border-ink bg-paper p-3 shadow-neo-sm" key={session.id}>
                    <p className="font-semibold">{session.prompt.title}</p>
                    <p className="mt-1 text-sm text-ink/80">
                      <Clock4 className="mr-1 inline size-4" />
                      {formatDateTime(session.createdAt)}
                    </p>
                    <Link
                      className="mt-2 inline-flex items-center gap-1 border-2 border-ink bg-blue-debate px-2 py-1 text-xs font-semibold uppercase"
                      to={`/report/${session.id}`}
                    >
                      Open report
                      <ArrowRight className="size-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </NeoCard>
        </motion.div>

        <motion.div {...cardMotion} transition={{ duration: 0.35, delay: 0.09 }}>
          <NeoCard accent="steel" className="space-y-4">
            <p className="inline-flex items-center gap-2 border-2 border-ink bg-orange-argument px-3 py-1 text-xs font-semibold uppercase">
              <Wrench className="size-4" />
              Roadmap / TODO
            </p>
            <ul className="space-y-2 text-sm">
              {roadmapItems.map((item) => (
                <li className="border-2 border-ink bg-paper px-3 py-2" key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </NeoCard>
        </motion.div>
      </section>
    </AppFrame>
  )
}
