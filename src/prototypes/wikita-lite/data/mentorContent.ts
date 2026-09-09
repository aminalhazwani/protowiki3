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
    name: 'Panini!',
    initial: 'P',
    bio: "Hello! I'm Panini. I enjoy writing about video games, music, and random stuff nobody sees. I'm here to help! If you have questions, feel free to ask them! I'll get to answering right away, as long as you give me like 3 days to do so (oops).",
    editingSince: 'Editing since 2020',
  },
} as const
