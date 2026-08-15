#!/usr/bin/env node

import { Command } from "commander";
import { devCommand } from "./commands/dev.js";
import { buildCommand } from "./commands/build.js";

const program = new Command();

program.name("pavilion-mfe").description("PavilionMfe micro-frontend framework CLI").version("0.1.0");

program
  .command("dev")
  .description("Start development servers")
  .option("-c, --config <path>", "Configuration file path")
  .option("-f, --filter <segments...>", "Only start specified segments")
  .action(devCommand);

program
  .command("build")
  .description("Build for production")
  .option("-n, --name <name>", "Segment name")
  .option("-v, --version <version>", "Version override")
  .option("-e, --env <env>", "Environment (dev/test/prod)")
  .action(buildCommand);

program.parse(process.argv);
