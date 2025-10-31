import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * PayFast ITN (Instant Transaction Notification) Webhook
 * 
 * Receives payment notifications from PayFast and updates database
 * 
 * @see https://developers.payfast.co.za/docs#itn
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log('[PayFast Webhook] Received ITN:', data);

    // Verify signature
    const signature = data['signature'];
    delete data['signature'];
    
    const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE;
    const calculatedSignature = generatePayFastSignature(data, PAYFAST_PASSPHRASE);
    
    if (signature !== calculatedSignature) {
      console.error('[PayFast Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Extract payment details
    const payment_status = data['payment_status'];
    const m_payment_id = data['m_payment_id'];
    const pf_payment_id = data['pf_payment_id'];
    const amount_gross = parseFloat(data['amount_gross']);
    const fee_assignment_id = data['custom_str1'];
    const student_id = data['custom_str2'];

    console.log('[PayFast Webhook] Payment Status:', payment_status, 'Payment ID:', m_payment_id);

    // Create Supabase client (service role for webhook)
    const supabase = await createClient();

    // Update payment record
    const { error: updateError } = await supabase
      .from('fee_payments')
      .update({
        payfast_transaction_id: pf_payment_id,
        payfast_status: payment_status,
        status: payment_status === 'COMPLETE' ? 'completed' : 'failed',
        processed_at: new Date().toISOString(),
      })
      .eq('payfast_payment_id', m_payment_id);

    if (updateError) {
      console.error('[PayFast Webhook] Failed to update payment:', updateError);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    // If payment successful, update fee assignment
    if (payment_status === 'COMPLETE') {
      const amount_cents = Math.round(amount_gross * 100);

      // Update the fee assignment (this will trigger the auto-update trigger)
      const { error: assignError } = await supabase
        .from('student_fee_assignments')
        .update({
          paid_amount_cents: supabase.raw(`paid_amount_cents + ${amount_cents}`),
          updated_at: new Date().toISOString(),
        })
        .eq('id', fee_assignment_id);

      if (assignError) {
        console.error('[PayFast Webhook] Failed to update assignment:', assignError);
      }

      // TODO: Send confirmation email to parent
      // TODO: Notify school of payment received

      console.log('[PayFast Webhook] Payment processed successfully:', m_payment_id);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[PayFast Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Generate PayFast signature for verification
 */
function generatePayFastSignature(data: Record<string, string>, passphrase?: string): string {
  let paramString = '';
  
  const sortedKeys = Object.keys(data).sort();
  
  for (const key of sortedKeys) {
    paramString += `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}&`;
  }
  
  paramString = paramString.slice(0, -1);
  
  if (passphrase) {
    paramString += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
  }
  
  return crypto.createHash('md5').update(paramString).digest('hex');
}

// Disable body parsing (PayFast sends form data)
export const config = {
  api: {
    bodyParser: false,
  },
};
