import config from '../config/config';
import { PolicyPage, PolicySection } from '@/app/components/PolicyPage';

export const metadata = {
  title: 'Privacy Policy | Sanctum Fabrics',
};

export default function PrivacyPage() {
  const { business } = config;

  return (
    <PolicyPage title="Privacy Policy" updated="31 July 2026">
      <PolicySection heading="1. Information We Collect">
        <p>
          When you create an account, place an order, or contact us, we collect information such as your name,
          email address, phone number, shipping address, and payment details (processed securely by our payment
          gateway partner — we never store your card or bank details ourselves).
        </p>
      </PolicySection>

      <PolicySection heading="2. How We Use Your Information">
        <ul className="list-disc space-y-1 pl-5">
          <li>To process and deliver your orders</li>
          <li>To communicate order updates, shipping status, and support requests</li>
          <li>To improve our products, website, and customer experience</li>
          <li>To send occasional updates about new collections (you can opt out anytime)</li>
        </ul>
      </PolicySection>

      <PolicySection heading="3. Payment Security">
        <p>
          All online payments are processed through Razorpay, a PCI-DSS compliant payment gateway. We do not store
          your full card, UPI, or bank account details on our servers.
        </p>
      </PolicySection>

      <PolicySection heading="4. Data Sharing">
        <p>
          We share your information only with trusted service providers necessary to fulfil your order — such as
          our payment gateway and courier/shipping partners. We do not sell your personal data to third parties.
        </p>
      </PolicySection>

      <PolicySection heading="5. Cookies">
        <p>
          We use cookies to keep you signed in, remember your cart, and understand how visitors use our site.
        </p>
      </PolicySection>

      <PolicySection heading="6. Your Rights">
        <p>
          You may request access to, correction of, or deletion of your personal data at any time by contacting us
          at{' '}
          <a href={`mailto:${business.contact.email}`} className="font-medium text-[color:var(--primary)] underline">
            {business.contact.email}
          </a>.
        </p>
      </PolicySection>

      <PolicySection heading="7. Contact Us">
        <p>
          Questions about this policy can be directed to {business.contact.email} or {business.contact.phone}.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
