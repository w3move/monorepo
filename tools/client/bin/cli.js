#! /usr/bin/env node

try {
  require('../dist');
} catch (error) {
  console.error(error.message.replace(__dirname, ''));
  process.exit(1);
}
