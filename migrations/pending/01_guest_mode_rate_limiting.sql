-- Guest Mode Rate Limiting
-- Prevents abuse of free exam generation by tracking IP addresses

-- Table to track guest usage
CREATE TABLE IF NOT EXISTS public.guest_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  resource_type TEXT NOT NULL, -- 'exam_prep', 'homework_help', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_guest_usage_ip_date 
  ON public.guest_usage_log(ip_address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guest_usage_created 
  ON public.guest_usage_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.guest_usage_log ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for logging)
CREATE POLICY "Anyone can log guest usage"
  ON public.guest_usage_log FOR INSERT
  WITH CHECK (true);

-- Policy: Only superadmin can view
CREATE POLICY "Superadmin can view guest usage"
  ON public.guest_usage_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- RPC Function: Check if guest has exceeded daily limit
CREATE OR REPLACE FUNCTION public.check_guest_limit(
  p_ip_address TEXT,
  p_resource_type TEXT DEFAULT 'exam_prep',
  p_daily_limit INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage_count INT;
  v_allowed BOOLEAN;
BEGIN
  -- Count usage in last 24 hours
  SELECT COUNT(*) INTO v_usage_count
  FROM public.guest_usage_log
  WHERE ip_address = p_ip_address
    AND resource_type = p_resource_type
    AND created_at > NOW() - INTERVAL '24 hours';
  
  v_allowed := v_usage_count < p_daily_limit;
  
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'usage_count', v_usage_count,
    'limit', p_daily_limit,
    'resets_at', (NOW() + INTERVAL '24 hours')::text,
    'message', CASE 
      WHEN v_allowed THEN 'Access granted'
      ELSE format('Daily limit reached (%s/%s). Resets in %s hours.', 
                   v_usage_count, p_daily_limit, 
                   EXTRACT(HOUR FROM (NOW() + INTERVAL '24 hours' - 
                     (SELECT MIN(created_at) FROM guest_usage_log 
                      WHERE ip_address = p_ip_address 
                        AND created_at > NOW() - INTERVAL '24 hours'))))
    END
  );
END;
$$;

-- RPC Function: Log guest usage
CREATE OR REPLACE FUNCTION public.log_guest_usage(
  p_ip_address TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_resource_type TEXT DEFAULT 'exam_prep',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.guest_usage_log (
    ip_address,
    user_agent,
    resource_type,
    metadata
  ) VALUES (
    p_ip_address,
    p_user_agent,
    p_resource_type,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Cleanup function (run daily via cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_guest_logs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  -- Delete logs older than 30 days
  DELETE FROM public.guest_usage_log
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % old guest usage logs', v_deleted_count;
  RETURN v_deleted_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_guest_limit(TEXT, TEXT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_guest_usage(TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_guest_logs() TO service_role;

-- Comments
COMMENT ON TABLE public.guest_usage_log IS 
  'Tracks guest (unauthenticated) usage for rate limiting. Cleaned up after 30 days.';

COMMENT ON FUNCTION public.check_guest_limit IS 
  'Checks if a guest IP has exceeded their daily limit for a resource type.';

COMMENT ON FUNCTION public.log_guest_usage IS 
  'Logs guest usage for rate limiting tracking.';
