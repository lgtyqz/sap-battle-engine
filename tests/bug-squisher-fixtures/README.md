# Bug Squisher fixtures

Copy generated `regression.fixture.json` files here, giving each a unique name
or subdirectory. `tests/bug-squisher.spec.ts` discovers every `.json` file
recursively and runs each independently against the engine source.

```sh
npx vitest run tests/bug-squisher.spec.ts
```

The suite also runs with `npm test`. No browser, credentials, network access,
built engine package, or sibling repository is needed.

Fixtures use schema version 1 from
[sap-battle-engine-bug-squisher](https://github.com/lgtyqz/sap-battle-engine-bug-squisher).
Keep generated config, random draw tape, decision overrides, metadata, and
reference observations intact. Fixtures without browser observations or a
recorded tape fail validation. Malformed files fail individually. A capture may
end before the simulated battle consumes its final seeded draws; the spec
reconstructs that deterministic tail from the fixture seed, verifies the
recorded prefix, and strictly replays one battle with the completed tape.

The spec compares living pets in front-to-back order, checks only observed
fields, and permits repeated observations to match the same event snapshot.
Checkpoint order, confidence, phase constraints, and explicit engine sequences
follow the producer's vendored alignment code. When present, the browser-observed
winner is checked; the input's reported outcome is not an expectation.

Incomplete captures assert all accepted checkpoints but do not establish full
battle coverage. This differs from the producer CLI's exit code 2 for incomplete
captures that otherwise match. Low-confidence or unmatched checkpoints fail.
Candidate status does not skip a case or turn a mismatch into an expected pass.
Review capture quality and random choices before diagnosing an engine defect.

`01a097ff-turn-6.fixture.json` is copied unchanged from the local Bug Squisher
checkout's `artifacts/latest/regression.fixture.json` (source HEAD
`37d17a582d47760a9c4d924e1ca872e6213f30db`; generated artifacts are not necessarily
tracked by that commit). It contains 17 accepted checkpoints, incomplete coverage,
and an observed draw. Candidate status intentionally does not suppress any remaining
behavioral mismatch.
