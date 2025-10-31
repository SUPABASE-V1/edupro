import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * PayFast Payment Initiation API
 * 
 * Creates a payment request and redirects parent to PayFast payment gateway
 * 
 * @see https://developers.payfast.co.za/docs#checkout_page
 */
export async function POST(request: NextRequest) {
  try {
    const { fee_assignment_id, amount_cents, student_id, description } = await request.json();

    // Validate inputs
    if (!fee_assignment_id || !amount_cents || !student_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify fee assignment belongs to user's child
    const { data: assignment, error: assignError } = await supabase
      .from('student_fee_assignments')
      .select('*')
      .eq('id', fee_assignment_id)
      .eq('student_id', student_id)
      .single();

    if (assignError || !assignment) {
      return NextResponse.json(
        { error: 'Fee assignment not found or access denied' },
        { status: 404 }
      );
    }

    // Verify the student is linked to this parent
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('parent_id, guardian_id')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if user is the parent or guardian
    if (student.parent_id !== user.id && student.guardian_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied - you are not the parent/guardian of this student' },
        { status: 403 }
      );
    }

    // PayFast credentials (from environment variables)
    const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
    const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
    const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE;
    const PAYFAST_URL = process.env.PAYFAST_SANDBOX === 'true'
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    if (!PAYFAST_MERCHANT_ID || !PAYFAST_MERCHANT_KEY) {
      console.error('PayFast credentials not configured');
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact school administrator.' },
        { status: 500 }
      );
    }

    // Generate unique payment reference
    const payment_id = crypto.randomUUID();
    
    // Calculate amount in rands
    const amount = (amount_cents / 100).toFixed(2);

    // Build PayFast data object
    const payfast_data: Record<string, string> = {
      merchant_id: PAYFAST_MERCHANT_ID,
      merchant_key: PAYFAST_MERCHANT_KEY,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/parent/payments?status=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/parent/payments?status=cancelled`,
      notify_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payfast/webhook`,
      
      // Payment details
      m_payment_id: payment_id,
      amount: amount,
      item_name: description || 'School Fee Payment',
      item_description: `Payment for ${description || 'School Fee'}`,
      
      // User details
      email_address: user.email || 'noreply@edudashpro.com',
      
      // Custom fields (for webhook processing)
      custom_str1: fee_assignment_id, // Fee assignment ID
      custom_str2: student_id, // Student ID
      custom_str3: user.id, // Parent user ID
    };

    // Generate signature
    const signature = generatePayFastSignature(payfast_data, PAYFAST_PASSPHRASE);
    payfast_data.signature = signature;

    // Create pending payment record
    await supabase
      .from('fee_payments')
      .insert({
        student_fee_assignment_id: fee_assignment_id,
        student_id: student_id,
        preschool_id: assignment.preschool_id,
        amount_cents: amount_cents,
        currency: 'ZAR',
        payment_method: 'payfast',
        payfast_payment_id: payment_id,
        status: 'pending',
        reference_number: payment_id,
      });

    // Build payment URL with query parameters
    const payment_url = PAYFAST_URL + '?' + new URLSearchParams(payfast_data).toString();

    return NextResponse.json({
      success: true,
      payment_url,
      payment_id,
    });

  } catch (error) {
    console.error('PayFast initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}

/**
 * Generate PayFast signature
 * @see https://developers.payfast.co.za/docs#checkout_page
 */
function generatePayFastSignature(data: Record<string, string>, passphrase?: string): string {
  // Create parameter string
  let paramString = '';
  
  // Sort keys alphabetically
  const sortedKeys = Object.keys(data).sort();
  
  for (const key of sortedKeys) {
    if (key !== 'signature') {
      paramString += `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}&`;
    }
  }
  
  // Remove last '&'
  paramString = paramString.slice(0, -1);
  
  // Add passphrase if provided
  if (passphrase) {
    paramString += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
  }
  
  // Generate MD5 hash
  return crypto.createHash('md5').update(paramString).digest('hex');
}
