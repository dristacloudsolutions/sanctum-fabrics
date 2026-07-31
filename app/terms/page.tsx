import config from '../config/config';
import { PolicyPage, PolicySection } from '@/app/components/PolicyPage';

export const metadata = {
  title: 'Terms & Conditions | Sanctum Fabrics',
};

export default function TermsPage() {
  const { business } = config;

  return (
    <PolicyPage title="Terms & Conditions" updated="31 July 2026">
      <PolicySection heading="1. About These Terms">
        <p>
          These Terms & Conditions govern your use of the {business.name} website and any purchase you make through
          it. By placing an order with us, you agree to these terms in full.
        </p>
      </PolicySection>

      <PolicySection heading="2. Products & Pricing">
        <p>
          All prices are listed in Indian Rupees (INR) and are inclusive of applicable GST unless stated otherwise.
          We make every effort to display product colors and details accurately, but slight variations may occur
          due to handcrafted processes, natural dyeing, and screen/display differences.
        </p>
      </PolicySection>

      <PolicySection heading="3. Order Acceptance">
        <p>
          Your order is confirmed once payment is successfully processed. We reserve the right to cancel or refuse
          any order due to product unavailability, pricing errors, or suspected fraudulent activity, in which case
          any amount paid will be refunded in full.
        </p>
      </PolicySection>

      <PolicySection heading="4. Payments">
        <p>
          We accept payments via our secure online payment gateway (Razorpay), including UPI, cards, and net
          banking. We do not currently offer Cash on Delivery.
        </p>
      </PolicySection>

      <PolicySection heading="5. Shipping & Delivery">
        <p>
          Please refer to our <a href="/shipping" className="font-medium text-[color:var(--primary)] underline">Shipping Policy</a> for delivery timelines and charges.
        </p>
      </PolicySection>

      <PolicySection heading="6. Returns & Exchanges">
        <p>
          Please refer to our <a href="/returns" className="font-medium text-[color:var(--primary)] underline">Returns & Exchange Policy</a> for eligibility and process.
        </p>
      </PolicySection>

      <PolicySection heading="7. Intellectual Property">
        <p>
          All content on this website — including product photography, descriptions, and branding — is the
          property of {business.name} and may not be reproduced without written permission.
        </p>
      </PolicySection>

      <PolicySection heading="8. Governing Law">
        <p>
          These terms are governed by the laws of India. Any disputes shall be subject to the exclusive
          jurisdiction of the courts.
        </p>
      </PolicySection>

      <PolicySection heading="9. Contact Us">
        <p>
          For any questions about these terms, reach us at{' '}
          <a href={`mailto:${business.contact.email}`} className="font-medium text-[color:var(--primary)] underline">
            {business.contact.email}
          </a>{' '}
          or {business.contact.phone}.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
