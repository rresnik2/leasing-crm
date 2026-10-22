import { useState } from 'react';

import Badge from './components/ui/Badge';
import Button from './components/ui/Button';
import Card from './components/ui/Card';
import ConfirmDialog from './components/ui/ConfirmDialog';
import EmptyState from './components/ui/EmptyState';
import IconButton from './components/ui/IconButton';
import Input from './components/ui/Input';
import Modal from './components/ui/Modal';
import Select from './components/ui/Select';
import Skeleton from './components/ui/Skeleton';
import StatusBadge from './components/ui/StatusBadge';
import Textarea from './components/ui/Textarea';
import { cn } from './components/ui/cn';
import { useToast } from './components/ui/useToast';
import PhoneInput from './components/PhoneInput';
import PipelineProgress from './components/PipelineProgress';
import {
  LEAD_STATUSES,
  MOVE_REASONS,
  PRIORITY_TONES,
  UNIT_TYPES,
} from './constants/leadOptions';

// dev-only living style guide, rendered at #design-system (see main.jsx).
// Every class name below is a complete static string so Tailwind's scanner sees it.

const ICON_PATHS = {
  plus: <path d="M12 5v14M5 12h14" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />,
  inbox: (
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </>
  ),
};

function Icon({ name, className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

// a captioned demo: every example on the page sits under one of these
function Demo({ caption, className, children }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <p className="text-caption text-fg-subtle">{caption}</p>
      {children}
    </div>
  );
}

const COLOR_GROUPS = [
  {
    name: 'Neutrals',
    tokens: [
      { cls: 'bg-canvas', role: 'Page background', light: true },
      { cls: 'bg-surface', role: 'Cards, panels, modals', light: true },
      { cls: 'bg-surface-muted', role: 'Subtle fills, hover rows', light: true },
      { cls: 'bg-line', role: 'Dividers, card borders', light: true },
      { cls: 'bg-line-strong', role: 'Form control borders' },
      { cls: 'bg-fg', role: 'Primary text' },
      { cls: 'bg-fg-muted', role: 'Secondary text, labels' },
      { cls: 'bg-fg-subtle', role: 'Captions, placeholders' },
      { cls: 'bg-fg-inverse', role: 'Text on solid fills', light: true },
    ],
  },
  {
    name: 'Brand',
    tokens: [
      { cls: 'bg-brand', role: 'Primary actions, links' },
      { cls: 'bg-brand-hover', role: 'Primary hover' },
      { cls: 'bg-brand-subtle', role: 'Selection, subtle fills', light: true },
      { cls: 'bg-brand-strong', role: 'Text on brand-subtle' },
    ],
  },
  {
    name: 'Danger',
    tokens: [
      { cls: 'bg-danger', role: 'Destructive actions, errors' },
      { cls: 'bg-danger-hover', role: 'Destructive hover' },
      { cls: 'bg-danger-subtle', role: 'Error fills', light: true },
      { cls: 'bg-danger-strong', role: 'Error text' },
    ],
  },
  {
    name: 'Success',
    tokens: [
      { cls: 'bg-success', role: 'Icons and fills only' },
      { cls: 'bg-success-subtle', role: 'Confirmation fills', light: true },
      { cls: 'bg-success-strong', role: 'Confirmation text' },
    ],
  },
  {
    name: 'Warning',
    tokens: [
      { cls: 'bg-warning', role: 'Icons and fills only' },
      { cls: 'bg-warning-subtle', role: 'Caution fills', light: true },
      { cls: 'bg-warning-strong', role: 'Caution text' },
    ],
  },
  {
    name: 'Focus',
    tokens: [{ cls: 'bg-focus', role: 'Focus rings' }],
  },
];

function ColorTokens() {
  return (
    <>
      {COLOR_GROUPS.map((group) => (
        <Demo key={group.name} caption={group.name}>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {group.tokens.map((token) => (
              <li key={token.cls} className="flex flex-col gap-2">
                <div className={cn('h-12 rounded-control', token.cls, token.light && 'border border-line')} />
                <div>
                  <p className="font-mono text-caption text-fg">{token.cls}</p>
                  <p className="text-caption text-fg-subtle">{token.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </Demo>
      ))}
    </>
  );
}

const TYPE_ROLES = [
  { cls: 'text-display', spec: '30/36, 700', sample: 'Lease the perfect home' },
  { cls: 'text-heading', spec: '20/28, 600', sample: 'Section and modal headings' },
  { cls: 'text-title', spec: '18/28, 600', sample: 'Jordan Alvarez' },
  { cls: 'text-body', spec: '14/20', sample: 'Default UI text for descriptions, table cells and helper copy.' },
  { cls: 'text-label', spec: '14/20, 500', sample: 'Form labels and button text' },
  { cls: 'text-caption', spec: '12/16', sample: 'Metadata, hints and helper text' },
];

function Typography() {
  return (
    <Demo caption="One sample per type role">
      <div className="flex flex-col">
        {TYPE_ROLES.map((role) => (
          <div
            key={role.cls}
            className="grid gap-1 border-b border-line py-4 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[9rem_1fr] sm:items-baseline sm:gap-4"
          >
            <div>
              <p className="font-mono text-caption text-fg">{role.cls}</p>
              <p className="text-caption text-fg-subtle">{role.spec}</p>
            </div>
            <p className={cn(role.cls, 'text-fg')}>{role.sample}</p>
          </div>
        ))}
      </div>
    </Demo>
  );
}

const RADII = [
  { cls: 'rounded-control', note: '8px: inputs, buttons' },
  { cls: 'rounded-card', note: '12px: cards, modals, panels' },
  { cls: 'rounded-full', note: 'Badges, pills, avatars' },
];

const SHADOWS = [
  { cls: 'shadow-card', note: 'Resting cards' },
  { cls: 'shadow-raised', note: 'Hover, floating buttons' },
  { cls: 'shadow-overlay', note: 'Modals, chat panel, toasts' },
];

function ShapeAndElevation() {
  return (
    <>
      <Demo caption="Radius">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {RADII.map((radius) => (
            <li key={radius.cls} className="flex flex-col gap-2">
              <div className={cn('h-16 w-16 border border-line-strong bg-surface-muted', radius.cls)} />
              <div>
                <p className="font-mono text-caption text-fg">{radius.cls}</p>
                <p className="text-caption text-fg-subtle">{radius.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </Demo>
      <Demo caption="Shadow">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {SHADOWS.map((shadow) => (
            <li key={shadow.cls} className="flex flex-col gap-3">
              <div className={cn('h-16 rounded-card border border-line bg-surface', shadow.cls)} />
              <div>
                <p className="font-mono text-caption text-fg">{shadow.cls}</p>
                <p className="text-caption text-fg-subtle">{shadow.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </Demo>
    </>
  );
}

const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost', 'danger'];
const BUTTON_SIZES = ['sm', 'md', 'lg'];

const ICON_BUTTONS = [
  { variant: 'ghost', label: 'Search', icon: 'search' },
  { variant: 'primary', label: 'Add lead', icon: 'plus' },
  { variant: 'secondary', label: 'Send email', icon: 'mail' },
  { variant: 'danger', label: 'Delete lead', icon: 'trash' },
];

function Buttons() {
  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        {BUTTON_VARIANTS.map((variant) => (
          <Demo key={variant} caption={`variant="${variant}", sizes sm / md / lg`}>
            <div className="flex flex-wrap items-center gap-3">
              {BUTTON_SIZES.map((size) => (
                <Button key={size} variant={variant} size={size}>
                  Button
                </Button>
              ))}
            </div>
          </Demo>
        ))}
      </div>
      <Demo caption="Leading icon, trailing icon, both">
        <div className="flex flex-wrap items-center gap-3">
          <Button leadingIcon={<Icon name="plus" />}>Add lead</Button>
          <Button variant="secondary" trailingIcon={<Icon name="arrowRight" />}>
            Next step
          </Button>
          <Button variant="ghost" leadingIcon={<Icon name="mail" />} trailingIcon={<Icon name="arrowRight" />}>
            Send email
          </Button>
          <Button variant="danger" size="sm" leadingIcon={<Icon name="trash" />}>
            Delete
          </Button>
        </div>
      </Demo>
      <div className="grid gap-6 sm:grid-cols-2">
        <Demo caption="loading (spinner replaces the leading icon, sets disabled and aria-busy)">
          <div className="flex flex-wrap items-center gap-3">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant} loading>
                Saving
              </Button>
            ))}
          </div>
        </Demo>
        <Demo caption="disabled">
          <div className="flex flex-wrap items-center gap-3">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant} disabled>
                Disabled
              </Button>
            ))}
          </div>
        </Demo>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {['sm', 'md'].map((size) => (
          <Demo key={size} caption={`IconButton size="${size}": ghost, primary, secondary, danger`}>
            <div className="flex flex-wrap items-center gap-3">
              {ICON_BUTTONS.map((button) => (
                <IconButton key={button.variant} variant={button.variant} size={size} label={button.label}>
                  <Icon name={button.icon} className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
                </IconButton>
              ))}
            </div>
          </Demo>
        ))}
      </div>
    </>
  );
}

function FormControls() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [badEmail, setBadEmail] = useState('jordan@');
  const [unitType, setUnitType] = useState('');
  const [moveReason, setMoveReason] = useState('');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Demo caption="Input with label and hint">
        <Input
          label="Full name"
          hint="As it appears on the application"
          placeholder="Jordan Alvarez"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Demo>
      <Demo caption="Input, required, with leadingIcon">
        <Input
          label="Email"
          type="email"
          required
          leadingIcon={<Icon name="mail" />}
          placeholder="jordan@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Demo>
      <Demo caption="Input with error">
        <Input
          label="Email"
          type="email"
          error="Enter a valid email address"
          value={badEmail}
          onChange={(e) => setBadEmail(e.target.value)}
        />
      </Demo>
      <Demo caption="Input, disabled">
        <Input label="Lead ID" hint="Assigned automatically" defaultValue="LD-1042" disabled />
      </Demo>
      <Demo caption="Select with options and placeholder">
        <Select
          label="Unit type"
          options={UNIT_TYPES}
          placeholder="Select a unit type"
          value={unitType}
          onChange={(e) => setUnitType(e.target.value)}
        />
      </Demo>
      <Demo caption="Select with error">
        <Select
          label="Reason for moving"
          options={MOVE_REASONS}
          placeholder="Select a reason"
          error="Choose a reason to continue"
          value={moveReason}
          onChange={(e) => setMoveReason(e.target.value)}
        />
      </Demo>
      <Demo caption="Textarea" className="sm:col-span-2">
        <Textarea
          label="Notes"
          hint="Visible to everyone on the leasing team"
          placeholder="Anything the next agent should know"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Demo>
      <Demo caption="PhoneInput (formats as you type, stores E.164 when valid)">
        <PhoneInput label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <p className="text-caption text-fg-subtle">Stored value: {phone || '(empty)'}</p>
      </Demo>
      <Demo caption="Bare Input with aria-label (search)">
        <Input
          type="search"
          aria-label="Search leads"
          leadingIcon={<Icon name="search" />}
          placeholder="Search leads"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Demo>
    </div>
  );
}

const SEMANTIC_TONES = ['neutral', 'brand', 'success', 'warning', 'danger'];
const CATEGORICAL_TONES = ['blue', 'yellow', 'purple', 'indigo', 'orange', 'green', 'teal', 'red', 'rose'];

const PRIORITY_SCORES = { High: 82, Medium: 56, Low: 24 };

function ToneRows({ tones }) {
  return (
    <div className="flex flex-col gap-3">
      {tones.map((tone) => (
        <div key={tone} className="flex flex-wrap items-center gap-3">
          <span className="w-20 font-mono text-caption text-fg-subtle">{tone}</span>
          <Badge tone={tone}>{tone}</Badge>
          <Badge tone={tone} dot>
            {tone}
          </Badge>
          <Badge tone={tone} size="sm">
            {tone}
          </Badge>
          <Badge tone={tone} size="sm" dot>
            {tone}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function Badges() {
  return (
    <>
      <Demo caption="Semantic tones: md, md with dot, sm, sm with dot">
        <ToneRows tones={SEMANTIC_TONES} />
      </Demo>
      <Demo caption="Categorical tones: md, md with dot, sm, sm with dot">
        <ToneRows tones={CATEGORICAL_TONES} />
      </Demo>
      <Demo caption="StatusBadge for every LEAD_STATUSES entry (color from STATUS_TONES)">
        <div className="flex flex-wrap items-center gap-3">
          {LEAD_STATUSES.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </Demo>
      <Demo caption="Badge for each PRIORITY_TONES tone (lead score priority)">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {Object.entries(PRIORITY_TONES).map(([priority, tone]) => (
            <div key={priority} className="flex items-center gap-2">
              <Badge tone={tone} dot>
                Score {PRIORITY_SCORES[priority]}
              </Badge>
              <span className="text-caption text-fg-subtle">
                {priority} priority, tone {tone}
              </span>
            </div>
          ))}
        </div>
      </Demo>
    </>
  );
}

const PIPELINE_SAMPLES = ['New Inquiry', 'Tour Completed', 'Approved', 'Leased', 'Search Hold', 'Archived'];

function Pipeline() {
  return (
    <>
      <Demo caption='variant="compact"'>
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {PIPELINE_SAMPLES.map((status) => (
            <Demo key={status} caption={status === 'Archived' ? 'Archived (unknown status)' : status}>
              <PipelineProgress status={status} variant="compact" />
            </Demo>
          ))}
        </div>
      </Demo>
      <Demo caption='variant="steps"'>
        <div className="flex flex-col gap-6">
          {PIPELINE_SAMPLES.map((status) => (
            <Demo key={status} caption={status === 'Archived' ? 'Archived (unknown status)' : status}>
              <PipelineProgress status={status} variant="steps" />
            </Demo>
          ))}
        </div>
      </Demo>
    </>
  );
}

const CARD_PADDINGS = [
  { padding: 'none', note: 'No padding' },
  { padding: 'sm', note: 'p-4' },
  { padding: 'md', note: 'p-5 (default)' },
  { padding: 'lg', note: 'p-6' },
];

function Cards() {
  const { toast } = useToast();

  return (
    <>
      <Demo caption="Static Card at each padding (the shaded block shows the content edge)">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CARD_PADDINGS.map(({ padding, note }) => (
            <Card key={padding} padding={padding} className="overflow-hidden">
              <div className="bg-surface-muted px-3 py-4">
                <p className="font-mono text-caption text-fg">padding="{padding}"</p>
                <p className="text-caption text-fg-subtle">{note}</p>
              </div>
            </Card>
          ))}
        </div>
      </Demo>
      <Demo caption="Interactive Card (click, Enter or Space fires an info toast)">
        <Card
          interactive
          className="max-w-md"
          onClick={() =>
            toast({
              title: 'Lead opened',
              description: 'Interactive cards respond to click, Enter and Space.',
              tone: 'info',
            })
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-title text-fg">Jordan Alvarez</h3>
              <p className="text-body text-fg-muted">jordan@example.com</p>
            </div>
            <StatusBadge status="Tour Scheduled" />
          </div>
          <PipelineProgress status="Tour Scheduled" className="mt-4" />
        </Card>
      </Demo>
    </>
  );
}

function EmptyAndSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Demo caption="EmptyState with icon and action">
        <div className="rounded-card border border-dashed border-line-strong">
          <EmptyState
            icon={<Icon name="inbox" className="h-6 w-6" />}
            title="No leads yet"
            description="New inquiries will show up here as soon as they come in."
            action={<Button leadingIcon={<Icon name="plus" />}>Add lead</Button>}
          />
        </div>
      </Demo>
      <Demo caption="Skeleton lead card (role=status container with an sr-only label)">
        <Card role="status">
          <span className="sr-only">Loading…</span>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-5 w-20 !rounded-full" />
          </div>
          <Skeleton className="mt-4 h-1.5 w-full !rounded-full" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </Card>
      </Demo>
    </div>
  );
}

function Overlays() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [modalName, setModalName] = useState('Jordan Alvarez');
  const [modalEmail, setModalEmail] = useState('jordan@example.com');

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        <Demo caption="Modal with form fields and a footer">
          <div>
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              Open modal
            </Button>
          </div>
        </Demo>
        <Demo caption="ConfirmDialog (confirm fires a success toast)">
          <div>
            <Button variant="danger" leadingIcon={<Icon name="trash" />} onClick={() => setConfirmOpen(true)}>
              Delete lead
            </Button>
          </div>
        </Demo>
      </div>
      <Demo caption="Toasts via useToast()">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => toast({ title: 'Heads up', description: 'This is an info toast.', tone: 'info' })}
          >
            Info toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast({ title: 'Lead saved', description: 'Your changes were saved.', tone: 'success' })}
          >
            Success toast
          </Button>
          <Button
            variant="danger"
            onClick={() => toast({ title: 'Something went wrong', description: 'We could not save that lead.', tone: 'danger' })}
          >
            Danger toast
          </Button>
        </div>
      </Demo>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit lead"
        description="Update the lead's contact details."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setModalOpen(false);
                toast({ title: 'Lead saved', description: `${modalName} was updated.`, tone: 'success' });
              }}
            >
              Save changes
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Full name" value={modalName} onChange={(e) => setModalName(e.target.value)} />
          <Input
            label="Email"
            type="email"
            value={modalEmail}
            onChange={(e) => setModalEmail(e.target.value)}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this lead?"
        description="This permanently removes Jordan Alvarez and their activity. This can't be undone."
        confirmLabel="Delete lead"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toast({ title: 'Lead deleted', description: 'Jordan Alvarez was removed.', tone: 'success' });
        }}
      />
    </>
  );
}

const SECTIONS = [
  { id: 'colors', title: 'Color tokens', Content: ColorTokens },
  { id: 'typography', title: 'Typography', Content: Typography },
  { id: 'shape', title: 'Shape & elevation', Content: ShapeAndElevation },
  { id: 'buttons', title: 'Buttons', Content: Buttons },
  { id: 'forms', title: 'Form controls', Content: FormControls },
  { id: 'badges', title: 'Badges', Content: Badges },
  { id: 'pipeline', title: 'Pipeline progress', Content: Pipeline },
  { id: 'cards', title: 'Cards', Content: Cards },
  { id: 'empty-skeleton', title: 'Empty state & skeleton', Content: EmptyAndSkeleton },
  { id: 'overlays', title: 'Overlays & feedback', Content: Overlays },
];

function DesignSystemGallery() {
  // the app listens for hashchange, so section links scroll instead of changing the hash
  const scrollToSection = (event, id) => {
    event.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <a href="#" className="inline-block rounded-control text-body text-brand hover:underline focus-ring">
          ← Back to app
        </a>
        <h1 className="mt-4 text-display text-fg">Design system</h1>
        <p className="mt-1 text-body text-fg-muted">
          Living style guide for Leasing CRM: tokens and components, rendered from the real primitives.
        </p>
      </header>

      <nav aria-label="Sections" className="mb-8">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {SECTIONS.map(({ id, title }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(event) => scrollToSection(event, id)}
                className="inline-block rounded-control text-body text-brand hover:underline focus-ring"
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col gap-8">
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-heading`}
            className="scroll-mt-6"
          >
            <h2 id={`${section.id}-heading`} className="mb-3 text-heading text-fg">
              {section.title}
            </h2>
            <Card padding="lg" className="flex flex-col gap-6">
              <section.Content />
            </Card>
          </section>
        ))}
      </div>
    </main>
  );
}

export default DesignSystemGallery;
