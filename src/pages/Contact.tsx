import { useState, type FormEvent } from 'react';
import { Button } from '../components/ui/Button';
import { ConfigValue, SetupNote, SocialLinks, WhatsAppButton } from '../components/ui/Contact';
import { SelectField, TextAreaField, TextField } from '../components/ui/Field';
import { ClockIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from '../components/ui/Icons';
import { PageHeader } from '../components/ui/PageHeader';
import { Reveal } from '../components/ui/Reveal';
import { site } from '../config/site';
import { useSeo } from '../hooks/useSeo';
import { hasWhatsAppNumber, whatsappLink } from '../lib/whatsapp';

const TOPICS = ['General question', 'Help choosing a watch', 'About an order', 'Something else'];

interface FormValues {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
}

type Errors = Partial<Record<keyof FormValues, string>>;
type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'handoff' } | { kind: 'error'; text: string };

const EMPTY: FormValues = { name: '', email: '', phone: '', topic: TOPICS[0], message: '' };

function validate(values: FormValues): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'Please tell us your name.';
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'That email address does not look right.';
  if (!values.email.trim() && !values.phone.trim()) errors.phone = 'Add a phone number or an email so we can reply.';
  if (values.message.trim().length < 10) errors.message = 'Please write a short message (at least 10 characters).';
  return errors;
}

function composeMessage(values: FormValues): string {
  const lines = [`Hello ${site.name}!`, '', `Topic: ${values.topic}`, values.message.trim(), '', `— ${values.name.trim()}`];
  if (values.phone.trim()) lines.push(`Phone: ${values.phone.trim()}`);
  if (values.email.trim()) lines.push(`Email: ${values.email.trim()}`);
  return lines.join('\n');
}

export default function Contact() {
  useSeo({
    title: 'Contact',
    description: 'Get in touch with WristGame — send a message, chat on WhatsApp or follow us on social media.',
  });

  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const { contact } = site;
  const usesEndpoint = Boolean(site.contactFormEndpoint);

  const set = (key: keyof FormValues) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
    if (status.kind !== 'idle' && status.kind !== 'sending') setStatus({ kind: 'idle' });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    const firstInvalid = (Object.keys(found) as (keyof FormValues)[])[0];
    if (firstInvalid) {
      document.getElementById(`contact-${firstInvalid}`)?.focus();
      return;
    }

    if (!usesEndpoint) {
      // No form backend configured: hand the message to WhatsApp, where the customer presses send.
      window.open(whatsappLink(composeMessage(values)), '_blank', 'noopener,noreferrer');
      setStatus({ kind: 'handoff' });
      return;
    }

    setStatus({ kind: 'sending' });
    try {
      const response = await fetch(site.contactFormEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      setStatus({ kind: 'sent' });
      setValues(EMPTY);
    } catch {
      setStatus({ kind: 'error', text: 'Your message could not be sent. Please try again, or reach us on WhatsApp.' });
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let’s talk watches"
        intro="Questions about a piece, an order or what suits your style? Send a message and we will get back to you."
        crumbs={[{ label: 'Contact' }]}
      />

      <section className="section section--flush-top" aria-label="Contact options">
        <div className="container contact-grid">
          <Reveal className="panel">
            <h2 className="display-title display-title--sm">Send a message</h2>
            <p className="panel__intro">
              {usesEndpoint
                ? 'Fill in the form and we will reply as soon as we can.'
                : 'Fill in the form and it opens in WhatsApp, ready for you to send.'}
            </p>

            <form className="form" onSubmit={onSubmit} noValidate>
              <div className="form__row">
                <TextField id="contact-name" label="Name" value={values.name} onChange={set('name')} error={errors.name} autoComplete="name" required />
                <SelectField id="contact-topic" label="Topic" value={values.topic} onChange={set('topic')}>
                  {TOPICS.map((topic) => (
                    <option key={topic}>{topic}</option>
                  ))}
                </SelectField>
              </div>
              <div className="form__row">
                <TextField id="contact-phone" label="Phone" type="tel" value={values.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" inputMode="tel" />
                <TextField id="contact-email" label="Email" type="email" value={values.email} onChange={set('email')} error={errors.email} autoComplete="email" />
              </div>
              <TextAreaField id="contact-message" label="Message" rows={5} value={values.message} onChange={set('message')} error={errors.message} required />

              <div className="form__actions">
                <Button type="submit" size="lg" disabled={status.kind === 'sending'} icon={usesEndpoint ? undefined : <WhatsAppIcon />} iconPosition="start">
                  {usesEndpoint ? (status.kind === 'sending' ? 'Sending…' : 'Send message') : 'Send via WhatsApp'}
                </Button>
              </div>

              <div aria-live="polite">
                {status.kind === 'handoff' && (
                  <p className="form__status">
                    WhatsApp has opened in a new tab with your message filled in — press send there to reach us. Nothing has been sent from this page.
                  </p>
                )}
                {status.kind === 'sent' && <p className="form__status form__status--ok">Thank you — your message has been sent.</p>}
                {status.kind === 'error' && <p className="form__status form__status--error">{status.text}</p>}
              </div>
            </form>
          </Reveal>

          <Reveal className="contact-aside" delay={120}>
            <div className="panel panel--accent">
              <h2 className="display-title display-title--sm">Chat on WhatsApp</h2>
              <p className="panel__intro">The fastest way to reach us — ask a question or place an order directly.</p>
              <WhatsAppButton block size="lg" />
              {!hasWhatsAppNumber() && (
                <SetupNote>
                  No WhatsApp number is set yet, so this opens WhatsApp without a recipient. Add yours in <code>src/config/site.ts</code>.
                </SetupNote>
              )}
            </div>

            <div className="panel">
              <h2 className="display-title display-title--sm">Customer support</h2>
              <ul className="contact-list">
                <li>
                  <PhoneIcon />
                  <div>
                    <p className="field-label">Phone</p>
                    <ConfigValue value={contact.phone} placeholder="Phone number — to be added" href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} />
                  </div>
                </li>
                <li>
                  <MailIcon />
                  <div>
                    <p className="field-label">Email</p>
                    <ConfigValue value={contact.email} placeholder="Email address — to be added" href={`mailto:${contact.email}`} />
                  </div>
                </li>
                <li>
                  <ClockIcon />
                  <div>
                    <p className="field-label">Support hours</p>
                    <ConfigValue value={contact.hours} placeholder="Opening hours — to be added" />
                  </div>
                </li>
                <li>
                  <PinIcon />
                  <div>
                    <p className="field-label">Address</p>
                    <ConfigValue value={contact.address} placeholder="Business address — to be added" />
                  </div>
                </li>
              </ul>
            </div>

            <div className="panel">
              <h2 className="display-title display-title--sm">Follow WristGame</h2>
              <p className="panel__intro">New arrivals, styling and behind-the-scenes.</p>
              <SocialLinks />
              {Object.values(site.social).every((url) => !url) && (
                <SetupNote>
                  Social icons are inactive until you add your profile links in <code>src/config/site.ts</code>.
                </SetupNote>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
