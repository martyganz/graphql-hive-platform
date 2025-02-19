import { SchemaPolicyProvider } from '../providers/schema-policy.provider';
import type { ProjectResolvers } from './../../../__generated__/types';

export const Project: Pick<ProjectResolvers, 'parentSchemaPolicy' | 'schemaPolicy' | '__isTypeOf'> =
  {
    schemaPolicy: async (project, _, { injector }) =>
      injector.get(SchemaPolicyProvider).getProjectPolicy({
        projectId: project.id,
        organizationId: project.orgId,
      }),
    parentSchemaPolicy: async (project, _, { injector }) =>
      injector.get(SchemaPolicyProvider).getOrganizationPolicyForProject({
        projectId: project.id,
        organizationId: project.orgId,
      }),
  };
