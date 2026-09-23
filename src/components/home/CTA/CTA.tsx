import Button from '@/components/common/Button';
import { Link } from '@/i18n/navigation';

export default function CTA() {
  return (
    <section className="cta">
      <div className="container-tcar">
        <div className="cta_content">
          <div className="cta_pattern" />

          <div className="cta_text">
            <h3>انضم كشريك معنا</h3>

            <p>
              انضم إلى منصة تي كار واعرض سياراتك أمام آلاف العملاء، واستقبل طلبات الحجز بكل سهولة.
            </p>

            <Link href="/join-us">
              <Button size="lg" className="bg-white text-primary border-0">
                انضم الآن
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
