import { determineRole, verifyToken } from './auth.service';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('auth.service', () => {
    describe('determineRole', () => {
        it('should return "admin" for username "admin"', () => {
            expect(determineRole('admin')).toBe('admin');
        });

        it('should return "nikita" for username "Никита"', () => {
            expect(determineRole('Никита')).toBe('nikita');
        });

        it('should return "survivor" for other usernames', () => {
            expect(determineRole('user123')).toBe('survivor');
            expect(determineRole('test')).toBe('survivor');
        });
    });

    describe('verifyToken', () => {
        const mockJwtVerify = jwt.verify as jest.Mock;

        beforeEach(() => {
            mockJwtVerify.mockReset();
        });

        it('should return decoded token if verification is successful', () => {
            const mockDecoded = { userId: '1', username: 'test', role: 'survivor' };
            mockJwtVerify.mockReturnValue(mockDecoded);

            const result = verifyToken('valid-token');
            expect(result).toEqual(mockDecoded);
            expect(mockJwtVerify).toHaveBeenCalledWith('valid-token', expect.any(String));
        });

        it('should return null if verification fails', () => {
            mockJwtVerify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            const result = verifyToken('invalid-token');
            expect(result).toBeNull();
        });
    });
});
