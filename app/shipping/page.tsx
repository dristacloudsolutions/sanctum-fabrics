import config from '../config/config';
import { PolicyPage, PolicySection } from '@/app/components/PolicyPage';

export const metadata = {
  title: 'Shipping Policy | Sanctum Fabrics',
};

export default function ShippingPage() {
  const { business } = config;

  return (
    <PolicyPage title="Shipping Policy" updated="31 July 2026">
      <PolicySection heading="1. Delivery Timelines">
        <p>
          Orders are typically processed within 1–2 business days and delivered within 4–7 business days across
          India, depending on your location. You will receive tracking details by email/SMS once your order ships.
        </p>
      </PolicySection>

      <PolicySection heading="2. Shipping Charges">
        <p>
          Shipping charges (if any) are calculated at checkout based on your delivery pincode and shown before you
          complete payment.
        </p>
      </PolicySection>

      <PolicySection heading="3. Order Tracking">
        <p>
          Once your order is shipped, you can track its status anytime from your{' '}
          <a href="/orders" className="font-medium text-[color:var(--primary)] underline">Orders</a> page.
        </p>
      </PolicySection>

      <PolicySection heading="4. Delays">
        <p>
          While we aim to meet the timelines above, delivery may occasionally be delayed due to courier network
          disruptions, weather, or remote pincode logistics. We will keep you informed if this happens.
        </p>
      </PolicySection>

      <PolicySection heading="5. Questions">
        <p>
          For shipping queries specific to your order, contact us at{' '}
          <a href={`mailto:${business.contact.email}`} className="font-medium text-[color:var(--primary)] underline">
            {business.contact.email}
          </a>{' '}
          or {business.contact.phone}.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
