/** Static Mentor module content — matches Figma T419358-Home. */

export const MENTOR_MODULE_TITLES = {
  unassigned: 'Mentor for editing',
  assigned: 'Your mentor',
} as const

export const MENTOR_UNASSIGNED = {
  description:
    'If you have questions about editing, an experienced editor can be assigned as your mentor to help you.',
  cta: 'Get a mentor',
} as const

export const MENTOR_ASSIGNED = {
  assignmentNotice:
    "We've assigned you an experienced editor to answer your questions about editing.",
  cta: 'Ask your mentor a question about editing',
  profile: {
    name: 'Samwalton9',
    initial: 'S',
    bio: "Hi! I'm Sam. I like helping on articles about video games and TV shows mainly. I also do a lot of moderating! I've been editing for quite a long time now so I'm happy to answer any questions you might have.",
    editingSince: 'Editing since 2011',
  },
} as const
