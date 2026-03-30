import { createBrowserRouter } from 'react-router-dom'
import { LandingPage } from '../features/landing/LandingPage'
import { PracticePage } from '../features/practice/PracticePage'
import { ReportPage } from '../features/report/ReportPage'

export const appRouter = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/practice', element: <PracticePage /> },
  { path: '/report/:sessionId', element: <ReportPage /> },
])
