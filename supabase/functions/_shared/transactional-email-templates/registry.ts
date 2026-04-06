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

export const TEMPLATES: Record<string, TemplateEntry> = {
  'new-user-notification': newUserNotification,
  'event-reminder': eventReminder,
  'coach-profile-ready': coachProfileReady,
}
