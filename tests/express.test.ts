import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { generateGSTCheckDigit } from '../src/utils/mod36';
import { generateVerhoeff } from '../src/utils/verhoeff';
import {
    pramanaMiddleware,
    validateAadhaar,
    validatePAN,
} from '../src/express';

const GST_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const buildAadhaar = (base11: string): string => `${base11}${generateVerhoeff(base11)}`;

const buildGSTIN = (base14: string): string => `${base14}${GST_CHARSET[generateGSTCheckDigit(base14)]}`;

const VALID_AADHAAR = buildAadhaar('28473910582');
const INVALID_AADHAAR = '999999990018';
const VALID_PAN = 'ABCPE1234F';
const INVALID_PAN = 'ABCDE1234F';
const VALID_GSTIN = buildGSTIN('27AAPFR5055K1Z');
const INVALID_GSTIN = '27AAPFR5055K1Z0';

const createPostApp = (middleware: ReturnType<typeof pramanaMiddleware>) => {
    const app = express();
    app.use(express.json());
    app.post('/test', middleware, (_req, res) => res.status(200).json({ ok: true }));
    return app;
};

const createParamApp = (middleware: ReturnType<typeof pramanaMiddleware>) => {
    const app = express();
    app.use(express.json());
    app.post('/test/:gstin', middleware, (_req, res) => res.status(200).json({ ok: true }));
    return app;
};

describe('Express middleware integration', () => {
    describe('1) valid request passes through', () => {
        it('POST /test with valid aadhaar in body returns 200', async () => {
            const app = createPostApp(
                pramanaMiddleware([{ field: 'aadhaar', type: 'aadhaar' }]),
            );

            const response = await request(app).post('/test').send({ aadhaar: VALID_AADHAAR });
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ ok: true });
        });

        it('POST /test with valid pan + valid gstin returns 200', async () => {
            const app = createPostApp(
                pramanaMiddleware([
                    { field: 'pan', type: 'pan' },
                    { field: 'gstin', type: 'gstin' },
                ]),
            );

            const response = await request(app)
                .post('/test')
                .send({ pan: VALID_PAN, gstin: VALID_GSTIN });
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ ok: true });
        });
    });

    describe('2) invalid field returns 422', () => {
        it('POST /test with invalid aadhaar returns 422', async () => {
            const app = createPostApp(
                pramanaMiddleware([{ field: 'aadhaar', type: 'aadhaar' }]),
            );

            const response = await request(app).post('/test').send({ aadhaar: INVALID_AADHAAR });
            expect(response.status).toBe(422);
        });

        it('response body includes status=error and errors array', async () => {
            const app = createPostApp(
                pramanaMiddleware([{ field: 'aadhaar', type: 'aadhaar' }]),
            );

            const response = await request(app).post('/test').send({ aadhaar: INVALID_AADHAAR });
            expect(response.body.status).toBe('error');
            expect(Array.isArray(response.body.errors)).toBe(true);
            expect(response.body.errors.length).toBeGreaterThan(0);
        });

        it('errors[0].field is aadhaar', async () => {
            const app = createPostApp(
                pramanaMiddleware([{ field: 'aadhaar', type: 'aadhaar' }]),
            );

            const response = await request(app).post('/test').send({ aadhaar: INVALID_AADHAAR });
            expect(response.body.errors[0].field).toBe('aadhaar');
        });

        it('errors[0].message contains meaningful text', async () => {
            const app = createPostApp(
                pramanaMiddleware([{ field: 'aadhaar', type: 'aadhaar' }]),
            );

            const response = await request(app).post('/test').send({ aadhaar: INVALID_AADHAAR });
            expect(typeof response.body.errors[0].message).toBe('string');
            expect(response.body.errors[0].message.length).toBeGreaterThan(8);
            expect(response.body.errors[0].message.toLowerCase()).toContain('invalid');
        });
    });

    describe('3) multiple invalid fields', () => {
        it('POST /test with 2 invalid fields returns two errors', async () => {
            const app = createPostApp(
                pramanaMiddleware([
                    { field: 'pan', type: 'pan' },
                    { field: 'gstin', type: 'gstin' },
                ]),
            );

            const response = await request(app)
                .post('/test')
                .send({ pan: INVALID_PAN, gstin: INVALID_GSTIN });

            expect(response.status).toBe(422);
            expect(response.body.errors).toHaveLength(2);
        });

        it('both invalid fields are listed in errors', async () => {
            const app = createPostApp(
                pramanaMiddleware([
                    { field: 'pan', type: 'pan' },
                    { field: 'gstin', type: 'gstin' },
                ]),
            );

            const response = await request(app)
                .post('/test')
                .send({ pan: INVALID_PAN, gstin: INVALID_GSTIN });

            const fields = response.body.errors.map((error: { field: string }) => error.field);
            expect(fields).toContain('pan');
            expect(fields).toContain('gstin');
        });

        it('errors preserve the requested document type', async () => {
            const app = createPostApp(
                pramanaMiddleware([
                    { field: 'pan', type: 'pan' },
                    { field: 'gstin', type: 'gstin' },
                ]),
            );

            const response = await request(app)
                .post('/test')
                .send({ pan: INVALID_PAN, gstin: INVALID_GSTIN });

            const byField = Object.fromEntries(
                response.body.errors.map((error: { field: string; type: string }) => [error.field, error.type]),
            );
            expect(byField.pan).toBe('pan');
            expect(byField.gstin).toBe('gstin');
        });
    });

    describe('4) optional field handling', () => {
        it('optional field absent passes through', async () => {
            const app = createPostApp(
                pramanaMiddleware([
                    { field: 'pan', type: 'pan' },
                    { field: 'gstin', type: 'gstin', optional: true },
                ]),
            );

            const response = await request(app).post('/test').send({ pan: VALID_PAN });
            expect(response.status).toBe(200);
        });

        it('optional field present but invalid returns 422', async () => {
            const app = createPostApp(
                pramanaMiddleware([
                    { field: 'pan', type: 'pan' },
                    { field: 'gstin', type: 'gstin', optional: true },
                ]),
            );

            const response = await request(app)
                .post('/test')
                .send({ pan: VALID_PAN, gstin: INVALID_GSTIN });

            expect(response.status).toBe(422);
            expect(response.body.errors[0].field).toBe('gstin');
        });

        it('optional field present and valid passes through', async () => {
            const app = createPostApp(
                pramanaMiddleware([
                    { field: 'pan', type: 'pan' },
                    { field: 'gstin', type: 'gstin', optional: true },
                ]),
            );

            const response = await request(app)
                .post('/test')
                .send({ pan: VALID_PAN, gstin: VALID_GSTIN });

            expect(response.status).toBe(200);
        });
    });

    describe('5) missing required field', () => {
        it('missing required field returns 422', async () => {
            const app = createPostApp(
                pramanaMiddleware([{ field: 'aadhaar', type: 'aadhaar' }]),
            );

            const response = await request(app).post('/test').send({});
            expect(response.status).toBe(422);
        });

        it('missing required field returns required message', async () => {
            const app = createPostApp(
                pramanaMiddleware([{ field: 'aadhaar', type: 'aadhaar' }]),
            );

            const response = await request(app).post('/test').send({});
            expect(response.body.errors[0].message).toContain('aadhaar is required');
        });

        it('required field missing in query location also fails', async () => {
            const app = createPostApp(
                pramanaMiddleware([{ field: 'pan', type: 'pan', location: 'query' }]),
            );

            const response = await request(app).post('/test').send({ pan: VALID_PAN });
            expect(response.status).toBe(422);
            expect(response.body.errors[0].field).toBe('pan');
        });
    });

    describe('6) location routing', () => {
        it('query rule reads from req.query and ignores body value for same field', async () => {
            const app = createPostApp(
                pramanaMiddleware([{ field: 'pan', type: 'pan', location: 'query' }]),
            );

            const response = await request(app)
                .post('/test?pan=ABCPE1234F')
                .send({ pan: INVALID_PAN });

            expect(response.status).toBe(200);
        });

        it('query rule fails when query value is invalid even if body value is valid', async () => {
            const app = createPostApp(
                pramanaMiddleware([{ field: 'pan', type: 'pan', location: 'query' }]),
            );

            const response = await request(app)
                .post('/test?pan=ABCDE1234F')
                .send({ pan: VALID_PAN });

            expect(response.status).toBe(422);
            expect(response.body.errors[0].field).toBe('pan');
        });

        it('params rule reads from req.params and ignores body for same field', async () => {
            const app = createParamApp(
                pramanaMiddleware([{ field: 'gstin', type: 'gstin', location: 'params' }]),
            );

            const response = await request(app)
                .post(`/test/${VALID_GSTIN}`)
                .send({ gstin: INVALID_GSTIN });

            expect(response.status).toBe(200);
        });

        it('params rule fails when params value is invalid', async () => {
            const app = createParamApp(
                pramanaMiddleware([{ field: 'gstin', type: 'gstin', location: 'params' }]),
            );

            const response = await request(app)
                .post(`/test/${INVALID_GSTIN}`)
                .send({ gstin: VALID_GSTIN });

            expect(response.status).toBe(422);
            expect(response.body.errors[0].field).toBe('gstin');
        });

        it('mixed body/query/params routing succeeds when all locations are valid', async () => {
            const app = express();
            app.use(express.json());
            app.post(
                '/test/:gstin',
                pramanaMiddleware([
                    { field: 'aadhaar', type: 'aadhaar', location: 'body' },
                    { field: 'pan', type: 'pan', location: 'query' },
                    { field: 'gstin', type: 'gstin', location: 'params' },
                ]),
                (_req, res) => res.status(200).json({ ok: true }),
            );

            const response = await request(app)
                .post(`/test/${VALID_GSTIN}?pan=${VALID_PAN}`)
                .send({ aadhaar: VALID_AADHAAR });

            expect(response.status).toBe(200);
        });

        it('mixed routing fails when one configured location has invalid value', async () => {
            const app = express();
            app.use(express.json());
            app.post(
                '/test/:gstin',
                pramanaMiddleware([
                    { field: 'aadhaar', type: 'aadhaar', location: 'body' },
                    { field: 'pan', type: 'pan', location: 'query' },
                    { field: 'gstin', type: 'gstin', location: 'params' },
                ]),
                (_req, res) => res.status(200).json({ ok: true }),
            );

            const response = await request(app)
                .post(`/test/${INVALID_GSTIN}?pan=${VALID_PAN}`)
                .send({ aadhaar: VALID_AADHAAR });

            expect(response.status).toBe(422);
            expect(response.body.errors.some((error: { field: string }) => error.field === 'gstin')).toBe(true);
        });
    });

    describe('7) convenience wrappers', () => {
        it('validateAadhaar() passes on valid aadhaar', async () => {
            const app = createPostApp(validateAadhaar());
            const response = await request(app).post('/test').send({ aadhaar: VALID_AADHAAR });
            expect(response.status).toBe(200);
        });

        it('validateAadhaar() fails on invalid aadhaar', async () => {
            const app = createPostApp(validateAadhaar());
            const response = await request(app).post('/test').send({ aadhaar: INVALID_AADHAAR });
            expect(response.status).toBe(422);
        });

        it('validateAadhaar() matches explicit pramanaMiddleware behavior', async () => {
            const appWrapper = createPostApp(validateAadhaar());
            const appExplicit = createPostApp(
                pramanaMiddleware([{ field: 'aadhaar', type: 'aadhaar' }]),
            );

            const wrapperResponse = await request(appWrapper).post('/test').send({ aadhaar: INVALID_AADHAAR });
            const explicitResponse = await request(appExplicit).post('/test').send({ aadhaar: INVALID_AADHAAR });

            expect(wrapperResponse.status).toBe(explicitResponse.status);
            expect(wrapperResponse.body.errors[0].field).toBe(explicitResponse.body.errors[0].field);
        });

        it('validatePAN custom field name validates the custom key', async () => {
            const app = createPostApp(validatePAN('pan_number'));
            const response = await request(app).post('/test').send({ pan_number: VALID_PAN });
            expect(response.status).toBe(200);
        });

        it('validatePAN custom field name reports custom field on error', async () => {
            const app = createPostApp(validatePAN('pan_number'));
            const response = await request(app).post('/test').send({ pan_number: INVALID_PAN });
            expect(response.status).toBe(422);
            expect(response.body.errors[0].field).toBe('pan_number');
        });

        it('validatePAN default field name works with pan', async () => {
            const app = createPostApp(validatePAN());
            const response = await request(app).post('/test').send({ pan: VALID_PAN });
            expect(response.status).toBe(200);
        });
    });
});
