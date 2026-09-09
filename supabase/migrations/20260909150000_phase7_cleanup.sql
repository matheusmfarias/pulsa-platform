-- Phase 7 cleanup: remove the password-based first-access heuristic.

drop function if exists public.get_my_worker_password_state();
