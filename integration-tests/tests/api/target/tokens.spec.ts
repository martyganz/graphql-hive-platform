import { ProjectType } from 'testkit/gql/graphql';
import { initSeed } from '../../../testkit/seed';

test.concurrent(
  'setting no scopes equals to readonly for organization, project, target',
  async ({ expect }) => {
    const { createOrg } = await initSeed().createOwner();
    const { createProject } = await createOrg();
    const { createTargetAccessToken } = await createProject(ProjectType.Single);

    // member should not have access to target:registry:write
    const token = await createTargetAccessToken({
      mode: 'noAccess',
    });
    const tokenInfo = await token.fetchTokenInfo();
    if (tokenInfo.__typename === 'TokenNotFoundError') {
      throw new Error('Token not found');
    }

    // organization
    expect(tokenInfo?.hasOrganizationRead).toBe(true);
    expect(tokenInfo?.hasOrganizationDelete).toBe(false);
    expect(tokenInfo?.hasOrganizationIntegrations).toBe(false);
    expect(tokenInfo?.hasOrganizationMembers).toBe(false);
    expect(tokenInfo?.hasOrganizationSettings).toBe(false);
    // project
    expect(tokenInfo?.hasProjectRead).toBe(true);
    expect(tokenInfo?.hasProjectDelete).toBe(false);
    expect(tokenInfo?.hasProjectAlerts).toBe(false);
    expect(tokenInfo?.hasProjectOperationsStoreRead).toBe(false);
    expect(tokenInfo?.hasProjectOperationsStoreWrite).toBe(false);
    expect(tokenInfo?.hasProjectSettings).toBe(false);
    // target
    expect(tokenInfo?.hasTargetRead).toBe(true);
    expect(tokenInfo?.hasTargetDelete).toBe(false);
    expect(tokenInfo?.hasTargetSettings).toBe(false);
    expect(tokenInfo?.hasTargetRegistryRead).toBe(false);
    expect(tokenInfo?.hasTargetRegistryWrite).toBe(false);
    expect(tokenInfo?.hasTargetTokensRead).toBe(false);
    expect(tokenInfo?.hasTargetTokensWrite).toBe(false);
  },
);

test.concurrent(
  'cannot set a scope on a token if user has no access to that scope',
  async ({ expect }) => {
    const { createOrg } = await initSeed().createOwner();
    const { createProject, inviteAndJoinMember } = await createOrg();
    const { createTargetAccessToken, target } = await createProject(ProjectType.Single);
    const { memberToken } = await inviteAndJoinMember();

    // member should not have access to target:registry:write (as it's only a Viewer)
    const tokenResult = createTargetAccessToken({
      mode: 'readWrite',
      target,
      actorToken: memberToken,
    });

    await expect(tokenResult).rejects.toThrowError(
      'No access (reason: "Missing permission for performing \'targetAccessToken:create\' on resource")',
    );
  },
);
