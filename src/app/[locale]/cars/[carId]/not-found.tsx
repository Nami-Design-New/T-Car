import { ResourceNotFound } from '@/shared/ui/ResourceNotFound';

export default function CarNotFound() {
  return <ResourceNotFound resource="cars" href="/cars" />;
}
