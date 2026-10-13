import { type FormEvent, useState } from 'react'
import { useRegistryActions } from '../hooks/useRegistryActions'
import { useTx } from '../hooks/useTx'
import { buildAgentURI } from '../lib/agentUri'
import { fieldClass } from '../lib/classes'
import { byteLength } from '../lib/format'
import type { Agent, Task } from '../types'
import { Button, Field, Modal } from './ui'

// Limits enforced by AgentRegistry (in bytes, so multi-byte characters count for more).
const MAX_NAME_BYTES = 48
const MAX_TEXT_BYTES = 512

function Actions({ submitLabel, disabled, onCancel }: { submitLabel: string; disabled: boolean; onCancel: () => void }) {
  const { busy } = useTx()
  return (
    <div className="mt-6 flex justify-end gap-2">
      <Button variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" disabled={disabled || busy}>
        {busy ? 'Confirming…' : submitLabel}
      </Button>
    </div>
  )
}

export function RegisterAgentDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { register } = useRegistryActions()

  const trimmedName = name.trim()
  const nameTooLong = byteLength(trimmedName) > MAX_NAME_BYTES

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (await register(trimmedName, buildAgentURI(trimmedName, description.trim()))) onClose()
  }

  return (
    <Modal title="Register an agent" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Agent name">
          <input
            autoFocus
            className={fieldClass}
            value={name}
            maxLength={40}
            placeholder="Atlas"
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="What does it do?" hint="optional">
          <textarea
            className={fieldClass}
            rows={3}
            value={description}
            maxLength={200}
            placeholder="Research agent that reads docs and writes short briefings."
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        {nameTooLong && <p className="text-sm text-rose">That name is too long. Try a shorter one.</p>}
        <p className="text-xs text-fog">
          Mints an ERC-721 identity to your wallet. The profile is stored as an ERC-8004 style registration file.
        </p>
        <Actions submitLabel="Register agent" disabled={!trimmedName || nameTooLong} onCancel={onClose} />
      </form>
    </Modal>
  )
}

export function AssignTaskDialog({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [description, setDescription] = useState('')
  const { createTask } = useRegistryActions()

  const trimmed = description.trim()
  const tooLong = byteLength(trimmed) > MAX_TEXT_BYTES

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (await createTask(agent.id, trimmed)) onClose()
  }

  return (
    <Modal title={`Assign a task to ${agent.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Task">
          <textarea
            autoFocus
            className={fieldClass}
            rows={3}
            value={description}
            maxLength={400}
            placeholder="Summarize the latest Monad release notes in three bullet points."
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        {tooLong && <p className="text-sm text-rose">That task is too long. Please shorten it.</p>}
        <p className="text-xs text-fog">
          Once {agent.name} delivers, you rate the result and its reputation updates on-chain.
        </p>
        <Actions submitLabel="Assign task" disabled={!trimmed || tooLong} onCancel={onClose} />
      </form>
    </Modal>
  )
}

export function DeliverTaskDialog({ task, agentName, onClose }: { task: Task; agentName: string; onClose: () => void }) {
  const [result, setResult] = useState('')
  const { completeTask } = useRegistryActions()

  const trimmed = result.trim()
  const tooLong = byteLength(trimmed) > MAX_TEXT_BYTES

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (await completeTask(task.id, trimmed)) onClose()
  }

  return (
    <Modal title={`Deliver as ${agentName}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-lg border border-line bg-ink-950 px-3 py-2.5 text-sm">
          <p className="text-xs text-fog">Task #{task.id.toString()}</p>
          <p className="mt-0.5 break-words">{task.description}</p>
        </div>
        <Field label="Result" hint="short summary or a link">
          <textarea
            autoFocus
            className={fieldClass}
            rows={3}
            value={result}
            maxLength={400}
            placeholder="Done. Summary: …"
            onChange={(event) => setResult(event.target.value)}
          />
        </Field>
        {tooLong && <p className="text-sm text-rose">That result is too long. Link to it instead.</p>}
        <Actions submitLabel="Deliver result" disabled={!trimmed || tooLong} onCancel={onClose} />
      </form>
    </Modal>
  )
}
