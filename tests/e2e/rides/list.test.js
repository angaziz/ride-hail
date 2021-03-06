/* eslint-disable no-await-in-loop */
/* eslint-disable security/detect-object-injection */
const {
  expect,
} = require('chai');
const request = require('supertest');
const buildApp = require('../../../src/server/app');
const {
  RidesService,
} = require('../../../src/services');
const ridesFixture = require('../../fixtures/rides');
const {
  NotFoundHttpError,
} = require('../../../src/helpers/http-errors');

describe('[INTEGRATION] [RIDES] [GET] - /rides', () => {
  let app;
  let db;

  before(async () => {
    ({ app, db } = await buildApp());
  });

  describe('Fail', () => {
    it('Should return not found error when there is no ride exist', () => {
      const expectedErrorResponse = new NotFoundHttpError(
        'RIDES_NOT_FOUND_ERROR',
        'Could not find any rides',
      );

      return request(app)
        .get('/rides')
        .expect('Content-Type', /application\/json/)
        .expect(404, expectedErrorResponse.getBody());
    });
  });

  describe('Success', () => {
    before(async () => {
      // Preparing data for success case
      const rideService = new RidesService(db, {
        info: () => {},
        error: () => {},
      });
      for (let i = 0; i < ridesFixture.length; i += 1) {
        await rideService.create(ridesFixture[i]);
      }
    });

    it('Should return list of rides with the requested number of records when the data is exist', () => {
      return request(app)
        .get('/rides')
        .query({
          offset: 0,
          limit: 2,
        })
        .expect('Content-Type', /application\/json/)
        .expect(200)
        .then((res) => {
          expect(res.body.data.length).to.equals(2);
        });
    });

    it('Should return list of rides with the available number of records when the request is exceeded the available number of records', () => {
      return request(app)
        .get('/rides')
        .query({
          offset: 0,
          limit: 5,
        })
        .expect('Content-Type', /application\/json/)
        .expect(200)
        .then((res) => {
          expect(res.body.data.length).to.equals(3);
        });
    });
  });

  describe('Security', () => {
    it('Should process with default pagination offset and limit numbers when offset is injected with malicious characters', () => {
      return request(app)
        .get('/rides')
        .query({
          offset: "0'",
          limit: 5,
        })
        .expect('Content-Type', /application\/json/)
        .expect(200)
        .then((res) => {
          expect(res.body.data.length).to.equals(3);
        });
    });

    it('Should process with default pagination offset and limit numbers when limit is injected with malicious characters', () => {
      return request(app)
        .get('/rides')
        .query({
          offset: 0,
          limit: "5'",
        })
        .expect('Content-Type', /application\/json/)
        .expect(200)
        .then((res) => {
          expect(res.body.data.length).to.equals(3);
        });
    });
  });
});
