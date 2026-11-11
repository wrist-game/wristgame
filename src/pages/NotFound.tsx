import { Button } from '../components/ui/Button';
import { useSeo } from '../hooks/useSeo';

interface NotFoundProps {
  title?: string;
  message?: string;
}

export default function NotFound({ title = 'Page not found', message = 'The page you are looking for has moved or never existed.' }: NotFoundProps) {
  useSeo({ title, noIndex: true });
  return (
    <section className="not-found">
      <div className="container container--narrow">
        <p className="not-found__code" aria-hidden="true">
          404
        </p>
        <h1 className="display-title">{title}</h1>
        <span className="gold-rule" aria-hidden="true" />
        <p className="lead">{message}</p>
        <div className="button-row button-row--center">
          <Button to="/shop">Shop watches</Button>
          <Button to="/" variant="outline">
            Back to home
          </Button>
        </div>
      </div>
    </section>
  );
}
