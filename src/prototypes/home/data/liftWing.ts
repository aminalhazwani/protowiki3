/**
 * Lift Wing, Wikimedia's model-inference service: the machine signals behind
 * Review changes. Every call is optional — a failure or slow answer yields
 * `null` (no signal), so a hint never holds up or breaks the module.
 */

import { wikimediaApiFetchHeaders } from '@/config'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'

const LIFT_WING = 'https://api.wikimedia.org/service/lw/inference/v1/models'
/** Shorter than the usual 7s: these are hints, not content. */
const TIMEOUT_MS = 5000
/** Edit Check reads a paragraph or two, not a whole diff. */
const TONE_TEXT_LIMIT = 2000

async function predict<T>(model: string, body: unknown, signal?: AbortSignal): Promise<T | null> {
  try {
    const response = await fetchWithTimeout(`${LIFT_WING}/${model}:predict`, {
      method: 'POST',
      signal,
      timeoutMs: TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        ...wikimediaApiFetchHeaders('home-review-changes'),
      },
      body: JSON.stringify(body),
    })
    return response.ok ? ((await response.json()) as T) : null
  } catch (err) {
    if (signal?.aborted) throw err
    return null
  }
}

/** Chance (0–1) the edit gets reverted — the language-agnostic revert-risk model. */
export async function predictRevertRisk(revid: number, signal?: AbortSignal): Promise<number | null> {
  const data = await predict<{ output?: { probabilities?: { true?: number } } }>(
    'revertrisk-language-agnostic',
    { rev_id: revid, lang: 'en' },
    signal,
  )
  return data?.output?.probabilities?.true ?? null
}

export interface ToneInput {
  title: string
  before: string
  after: string
}

/**
 * Edit Check's tone check (promotional or non-neutral wording), for several
 * edits in one call. Per input: the chance its new text has a tone issue
 * (0 when the model says it doesn't), or `null` if unscored.
 */
export async function predictToneIssues(
  inputs: ToneInput[],
  signal?: AbortSignal,
): Promise<(number | null)[]> {
  if (!inputs.length) return []
  const data = await predict<{ predictions?: { prediction?: boolean; probability?: number }[] }>(
    'edit-check',
    {
      instances: inputs.map(({ title, before, after }) => ({
        lang: 'en',
        check_type: 'tone',
        page_title: title,
        original_text: before.slice(0, TONE_TEXT_LIMIT),
        modified_text: after.slice(0, TONE_TEXT_LIMIT),
      })),
    },
    signal,
  )
  return inputs.map((_, index) => {
    const result = data?.predictions?.[index]
    if (typeof result?.prediction !== 'boolean') return null
    return result.prediction ? (result.probability ?? 0) : 0
  })
}
