import { getRoundState } from './round.service';
import { Round } from '../db/schema';

describe('getRoundState', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    const createRound = (startTime: Date, endTime: Date): Round => ({
        id: 'test-id',
        startTime,
        endTime,
        totalScore: 0,
        winnerId: null,
        createdAt: new Date(),
    });

    it('should return "cooldown" if current time is before start time', () => {
        const now = new Date('2024-01-01T10:00:00Z');
        jest.setSystemTime(now);

        const startTime = new Date('2024-01-01T10:01:00Z');
        const endTime = new Date('2024-01-01T10:02:00Z');
        const round = createRound(startTime, endTime);

        expect(getRoundState(round)).toBe('cooldown');
    });

    it('should return "active" if current time is equal to start time', () => {
        const now = new Date('2024-01-01T10:00:00Z');
        jest.setSystemTime(now);

        const startTime = new Date('2024-01-01T10:00:00Z');
        const endTime = new Date('2024-01-01T10:01:00Z');
        const round = createRound(startTime, endTime);

        expect(getRoundState(round)).toBe('active');
    });

    it('should return "active" if current time is within round duration', () => {
        const now = new Date('2024-01-01T10:00:30Z');
        jest.setSystemTime(now);

        const startTime = new Date('2024-01-01T10:00:00Z');
        const endTime = new Date('2024-01-01T10:01:00Z');
        const round = createRound(startTime, endTime);

        expect(getRoundState(round)).toBe('active');
    });

    it('should return "active" if current time is equal to end time', () => {
        const now = new Date('2024-01-01T10:01:00Z');
        jest.setSystemTime(now);

        const startTime = new Date('2024-01-01T10:00:00Z');
        const endTime = new Date('2024-01-01T10:01:00Z');
        const round = createRound(startTime, endTime);

        expect(getRoundState(round)).toBe('active');
    });

    it('should return "finished" if current time is after end time', () => {
        const now = new Date('2024-01-01T10:01:01Z');
        jest.setSystemTime(now);

        const startTime = new Date('2024-01-01T10:00:00Z');
        const endTime = new Date('2024-01-01T10:01:00Z');
        const round = createRound(startTime, endTime);

        expect(getRoundState(round)).toBe('finished');
    });
});
