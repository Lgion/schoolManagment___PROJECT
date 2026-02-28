import { faker } from '@faker-js/faker';

export type User = {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'enseignant';
    createdAt: Date;
};

export const createUser = (overrides: Partial<User> = {}): User => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: 'enseignant',
    createdAt: new Date(),
    ...overrides,
});

export const createAdminUser = (overrides: Partial<User> = {}): User =>
    createUser({ role: 'admin', ...overrides });

export type ClassModel = {
    id: string;
    name: string;
    level: string;
    capacity: number;
};

export const createClass = (overrides: Partial<ClassModel> = {}): ClassModel => ({
    id: faker.string.uuid(),
    name: `Class ${faker.string.alpha(2).toUpperCase()}`,
    level: faker.helpers.arrayElement(['6ème', '5ème', '4ème', '3ème']),
    capacity: faker.number.int({ min: 15, max: 35 }),
    ...overrides,
});
