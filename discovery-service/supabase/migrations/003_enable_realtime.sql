-- Enable Supabase Realtime on intents table
-- Allows agents to subscribe to new intents in real-time instead of polling

alter publication supabase_realtime add table intents;

-- Also enable on offers for bidirectional updates
alter publication supabase_realtime add table offers;

comment on publication supabase_realtime is 'Realtime publication for agent subscriptions';
