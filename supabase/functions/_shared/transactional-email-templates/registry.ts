/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as newUserNotification } from './new-user-notification.tsx'
import { template as eventReminder } from './event-reminder.tsx'
import { template as coachProfileReady } from './coach-profile-ready.tsx'
import { template as coachWeeklyDigest } from './coach-weekly-digest.tsx'
import { template as coachMessage } from './coach-message.tsx'
import { template as athleteActivityNotification } from './athlete-activity-notification.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'new-user-notification': newUserNotification,
  'event-reminder': eventReminder,
  'coach-profile-ready': coachProfileReady,
  'coach-weekly-digest': coachWeeklyDigest,
  'coach-message': coachMessage,
  'athlete-activity-notification': athleteActivityNotification,
}
