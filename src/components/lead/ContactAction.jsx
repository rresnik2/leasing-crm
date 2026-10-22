import { mailtoHref, smsHref, telHref } from '../../utils/contactLinks';
import Button from '../ui/Button';
import { cn } from '../ui/cn';
import Icon from './icons';

// Same look as Button, for anchors (Button only renders a <button>).
const LINK_BASE =
  'inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors duration-fast ease-standard focus-ring';
const LINK_VARIANTS = {
  primary: 'bg-brand text-fg-inverse hover:bg-brand-hover',
  secondary: 'bg-surface border border-line-strong text-fg hover:bg-surface-muted',
};
const LINK_SIZES = { sm: 'h-8 px-3 text-caption', md: 'h-10 px-4 text-label' };

export function LinkButton({ href, variant = 'secondary', size = 'md', icon, className, children, ...rest }) {
  return (
    <a href={href} {...rest} className={cn(LINK_BASE, LINK_VARIANTS[variant], LINK_SIZES[size], className)}>
      {icon && <span aria-hidden="true" className="inline-flex shrink-0">{icon}</span>}
      {children}
    </a>
  );
}

const KINDS = {
  call: { icon: 'phone', href: (lead) => telHref(lead.phone) },
  text: { icon: 'text', href: (lead) => smsHref(lead.phone) },
  email: { icon: 'email', href: (lead) => mailtoHref(lead.email) },
};

// tel/sms/mailto link for a lead; a disabled button when the lead has no usable number or address.
// onContact(kind) lets the page switch the activity composer to the matching type.
export default function ContactAction({ kind, lead, label, variant = 'secondary', size = 'md', onContact, className }) {
  const config = KINDS[kind];
  const href = config.href(lead);
  const icon = <Icon name={config.icon} />;

  if (!href) {
    return (
      <Button variant={variant} size={size} disabled leadingIcon={icon} className={className}>
        {label}
      </Button>
    );
  }
  return (
    <LinkButton href={href} variant={variant} size={size} icon={icon} className={className} onClick={() => onContact?.(kind)}>
      {label}
    </LinkButton>
  );
}
