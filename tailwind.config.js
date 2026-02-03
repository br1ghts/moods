import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.js',
        './resources/js/**/*.jsx',
        './resources/js/**/*.json',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                cobalt: {
                    400: '#4f6cff',
                    500: '#3654ff',
                },
                coral: {
                    400: '#ff8a65',
                    500: '#ff7043',
                },
                mint: {
                    400: '#2dd4bf',
                    500: '#14b8a6',
                },
            },
        },
    },

    plugins: [forms],
};
