/**
 * The terminal session of the home page, recorded with
 * scripts/record-terminal.py on 2026-10-08: a real bash on a laptop, the
 * spawner CLI 2.0.0 against a local install (localtest.me), the command
 * typed key by key. It replays in real time.
 *
 * The project is examples/node-postgres set up with `spawner init`, its
 * database healthcheck polled every 250 ms while it starts
 * (`start_interval`), its images already built by a first deploy (12 s).
 * Five new branches in a row took 5, 5, 6, 6 and 5 s by the CLI's count,
 * 3.9 to 5 s on the server: the CLI checks the job every 1.5 s.
 */
import { parseCast } from '../../lib/cast';
import newEnvironmentCast from './new-environment.cast?raw';

/** spawner up on a new branch with a file changed: a new environment, ready in 5 seconds. */
export const newEnvironment = parseCast(newEnvironmentCast, { idleLimit: 30 });
