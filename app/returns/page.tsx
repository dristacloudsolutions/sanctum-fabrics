import config from '../config/config';
import { PolicyPage, PolicySection } from '@/app/components/PolicyPage';

export const metadata = {
  title: 'Returns & Exchange Policy | Sanctum Fabrics',
};

export default function ReturnsPage() {
  const { business } = config;

  return (
    <PolicyPage title="Returns & Exchange Policy" updated="31 July 2026">
      <PolicySection heading="1. Return & Exchange Window">
        <p>
          You may request a return or exchange within <strong>7 days</strong> of your order being marked delivered.
          Requests made after this window cannot be accepted. You can raise a request directly from your{' '}
          <a href="/orders" className="font-medium text-[color:var(--primary)] underline">Orders</a> page.
        </p>
      </PolicySection>

      <PolicySection heading="2. Eligibility">
        <p>Items are eligible for return or exchange if they are:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Unworn, unwashed, and unused, with all original tags attached</li>
          <li>In their original packaging</li>
          <li>Free of any alterations, perfume, or makeup marks</li>
        </ul>
        <p>
          Due to hygiene and craftsmanship considerations, blouse pieces that have been cut or stitched, and
          made-to-order or customised pieces, are not eligible for return.
        </p>
      </PolicySection>

      <PolicySection heading="3. Common Reasons We Accept">
        <ul className="list-disc space-y-1 pl-5">
          <li>Size or fit issue</li>
          <li>Color noticeably different from what was shown on the website</li>
          <li>Quality issue or manufacturing defect</li>
          <li>Wrong item received</li>
          <li>Item damaged in transit</li>
        </ul>
      </PolicySection>

      <PolicySection heading="4. How It Works">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Raise a return or exchange request from your order within 7 days of delivery.</li>
          <li>Our team reviews the request and approves or asks for more details (e.g. photos for a damage claim).</li>
          <li>Once approved, we arrange a pickup — or you may be asked to self-ship, depending on your location.</li>
          <li>After the item is received and inspected, we process your refund or dispatch the exchanged item.</li>
        </ol>
      </PolicySection>

      <PolicySection heading="5. Refunds">
        <p>
          Approved refunds are credited to your original payment method within 5–7 business days of the returned
          item being received and inspected. Shipping charges, if any, are non-refundable unless the return is due
          to our error (wrong/damaged/defective item).
        </p>
      </PolicySection>

      <PolicySection heading="6. Exchanges">
        <p>
          Exchanges are subject to availability of the requested size/color/variant at the time of approval. If the
          requested variant is unavailable, we will offer a refund instead.
        </p>
      </PolicySection>

      <PolicySection heading="7. Need Help?">
        <p>
          Reach us at{' '}
          <a href={`mailto:${business.contact.email}`} className="font-medium text-[color:var(--primary)] underline">
            {business.contact.email}
          </a>{' '}
          or {business.contact.phone} for anything not covered here.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
