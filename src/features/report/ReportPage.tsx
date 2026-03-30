import { Link, useParams } from 'react-router-dom'
import { AppFrame } from '../../components/layout/AppFrame'
import { NeoButton } from '../../components/ui/NeoButton'
import { NeoCard } from '../../components/ui/NeoCard'
import { useLocalSessions } from '../../hooks/useLocalSessions'
import { formatDateTime } from '../../lib/formatters'

export function ReportPage() {
  const { sessionId = '' } = useParams()
  const { getSessionById } = useLocalSessions()
  const session = getSessionById(sessionId)

  if (!session) {
    return (
      <AppFrame>
        <NeoCard accent="red" className="max-w-2xl space-y-4">
          <h1 className="text-3xl uppercase">Session not found</h1>
          <p>
            This report is unavailable in local storage. Start a new practice round to generate a
            new session recap.
          </p>
          <Link to="/practice">
            <NeoButton>Start Practice</NeoButton>
          </Link>
        </NeoCard>
      </AppFrame>
    )
  }

  return (
    <AppFrame className="space-y-6">
      <NeoCard accent="blue" className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em]">Session Recap</p>
        <h1 className="text-3xl uppercase">{session.prompt.title}</h1>
        <p className="text-sm">Recorded {formatDateTime(session.createdAt)}</p>
        <Link to="/practice">
          <NeoButton variant="secondary">Run Another Session</NeoButton>
        </Link>
      </NeoCard>

      <section className="grid gap-5 md:grid-cols-2">
        <NeoCard accent="orange" className="space-y-3">
          <h2 className="text-xl uppercase">Opening Transcript</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{session.openingTranscript}</p>
        </NeoCard>

        <NeoCard accent="teal" className="space-y-3">
          <h2 className="text-xl uppercase">Opening Coaching</h2>
          <p>{session.openingFeedback.summary}</p>
          <p className="font-semibold">Coach question:</p>
          <p>{session.openingFeedback.coachQuestion}</p>
        </NeoCard>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <NeoCard accent="lime" className="space-y-3">
          <h2 className="text-xl uppercase">Counterpoint Used</h2>
          <p className="border-2 border-ink bg-paper p-2 text-sm font-semibold">
            {session.selectedCounterpoint.title}
          </p>
          <p>{session.selectedCounterpoint.text}</p>
          <p className="mt-3 font-semibold">Rebuttal Transcript</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{session.rebuttalTranscript}</p>
        </NeoCard>

        <NeoCard accent="red" className="space-y-3">
          <h2 className="text-xl uppercase">Final Session Summary</h2>
          <p>{session.finalSummary.overallAssessment}</p>
          <p>
            <span className="font-semibold">Best moment:</span> {session.finalSummary.bestMoment}
          </p>
          <p>
            <span className="font-semibold">Next rep:</span> {session.finalSummary.nextRep}
          </p>
          <p>
            <span className="font-semibold">Reflection prompt:</span>{' '}
            {session.finalSummary.reflectionPrompt}
          </p>
          <p className="border-2 border-ink bg-paper p-3 text-sm">
            <span className="font-semibold">Student reflection:</span>{' '}
            {session.reflection || 'No reflection saved yet.'}
          </p>
        </NeoCard>
      </section>
    </AppFrame>
  )
}
