import ora, { type Ora } from 'ora';

export const createSpinner = (text: string): Ora => ora({
    text,
    color: 'cyan',
});

export const runWithSpinner = async <T>(text: string, task: () => Promise<T>): Promise<T> => {
    const spinner = createSpinner(text);
    spinner.start();

    try {
        const result = await task();
        spinner.succeed(`${text} complete`);
        return result;
    } catch (error: unknown) {
        spinner.fail(`${text} failed`);
        throw error;
    }
};
