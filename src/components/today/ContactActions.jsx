import { mailtoHref, smsHref, telHref } from '../../utils/contactLinks';
import { cn } from '../ui/cn';
import { MailIcon, MessageIcon, PhoneIcon } from './icons';

const style =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-line-strong bg-surface text-fg-muted transition-colors duration-fast ease-standard hover:bg-surface-muted hover:text-fg focus-ring';

function Action({ href, label, children }) {
  if (!href) {
    return (
      <button type="button" disabled aria-label={label} title={`${label} (no valid contact info)`} className={cn(style, 'opacity-50 cursor-not-allowed')}>
        {children}
      </button>
    );
  }
  return (
    <a href={href} aria-label={label} title={label} className={style}>
      {children}
    </a>
  );
}

// Call / Text / Email icon links for a lead; disabled when the contact info is missing or invalid.
function ContactActions({ lead }) {
  return (
    <>
      <Action href={telHref(lead.phone)} label={`Call ${lead.name}`}><PhoneIcon /></Action>
      <Action href={smsHref(lead.phone)} label={`Text ${lead.name}`}><MessageIcon /></Action>
      <Action href={mailtoHref(lead.email)} label={`Email ${lead.name}`}><MailIcon /></Action>
    </>
  );
}

export default ContactActions;
