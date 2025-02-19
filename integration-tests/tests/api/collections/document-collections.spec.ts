/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { ProjectType } from 'testkit/gql/graphql';
import { initSeed } from '../../../testkit/seed';

describe('Document Collections', () => {
  describe('CRUD', () => {
    it.concurrent('Create, update and delete a Collection', async () => {
      const { createDocumentCollection, updateDocumentCollection, deleteDocumentCollection } =
        await initSeed()
          .createOwner()
          .then(r => r.createOrg())
          .then(r => r.createProject(ProjectType.Single));

      // Create a collection
      const createDocumentCollectionResult = await createDocumentCollection({
        name: 'My Collection',
        description: 'My favorite queries',
      });
      expect(createDocumentCollectionResult.error).toBeNull();
      expect(createDocumentCollectionResult.ok?.collection.id).toBeDefined();
      expect(
        createDocumentCollectionResult.ok?.updatedTarget.documentCollections.edges.length,
      ).toBe(1);

      // Update the collection
      const updateDocumentCollectionResult = await updateDocumentCollection({
        collectionId: createDocumentCollectionResult.ok?.collection.id!,
        name: 'Best Queries #3',
        description: 'My favorite queries updated',
      });
      expect(updateDocumentCollectionResult.error).toBeNull();
      expect(updateDocumentCollectionResult.ok?.collection.id).toBeDefined();
      expect(updateDocumentCollectionResult.ok?.collection.name).toBe('Best Queries #3');
      expect(updateDocumentCollectionResult.ok?.collection.description).toBe(
        'My favorite queries updated',
      );
      expect(
        updateDocumentCollectionResult.ok?.updatedTarget.documentCollections.edges.length,
      ).toBe(1);

      // Delete the collection
      const deleteDocumentCollectionResult = await deleteDocumentCollection({
        collectionId: createDocumentCollectionResult.ok?.collection.id!,
      });
      expect(deleteDocumentCollectionResult.error).toBeNull();
      expect(deleteDocumentCollectionResult.ok?.deletedId).toBe(
        updateDocumentCollectionResult.ok?.collection.id,
      );
      expect(
        deleteDocumentCollectionResult.ok?.updatedTarget.documentCollections.edges.length,
      ).toBe(0);
    });

    it.concurrent('Create, update and delete an operation inside a collection', async () => {
      const {
        createDocumentCollection,
        createOperationInCollection,
        updateOperationInCollection,
        deleteOperationInCollection,
      } = await initSeed()
        .createOwner()
        .then(r => r.createOrg())
        .then(r => r.createProject(ProjectType.Single));
      const createDocumentCollectionResult = await createDocumentCollection({
        name: 'My Collection',
        description: 'My favorite queries',
      });
      expect(createDocumentCollectionResult.error).toBeNull();
      const collectionId = createDocumentCollectionResult.ok?.collection.id!;
      expect(collectionId).toBeDefined();

      const createResult = await createOperationInCollection({
        collectionId,
        name: 'My Operation',
        query: 'query { hello }',
      });

      expect(createResult.error).toBeNull();
      const operationId = createResult.ok?.operation?.id!;
      expect(operationId).toBeDefined();
      expect(createResult.ok?.operation?.name).toBe('My Operation');
      expect(createResult.ok?.collection.operations.edges.length).toBe(1);

      const updateResult = await updateOperationInCollection({
        collectionId,
        operationId,
        name: 'My Updated Operation',
        query: 'query { hello world }',
        variables: JSON.stringify({
          id: '1',
        }),
        headers: JSON.stringify({
          Key: '3',
        }),
      });

      expect(updateResult.error).toBeNull();
      expect(updateResult.ok?.operation?.id).toBeDefined();
      expect(updateResult.ok?.operation?.name).toBe('My Updated Operation');
      expect(updateResult.ok?.operation?.query).toBe('query { hello world }');
      expect(updateResult.ok?.operation?.headers).toBe(
        JSON.stringify({
          Key: '3',
        }),
      );
      expect(updateResult.ok?.operation?.variables).toBe(
        JSON.stringify({
          id: '1',
        }),
      );
      const deleteResult = await deleteOperationInCollection({
        operationId,
      });

      expect(deleteResult.error).toBeNull();
      expect(deleteResult.ok?.deletedId).toBe(operationId);
      expect(deleteResult.ok?.updatedTarget.documentCollections.edges.length).toBe(1);
      expect(
        deleteResult.ok?.updatedTarget.documentCollections.edges[0].node.operations.edges.length,
      ).toBe(0);
    });

    describe('Permissions Check', () => {
      it('Prevent creating collection without the write permission to the target', async () => {
        const { createDocumentCollection, createTargetAccessToken } = await initSeed()
          .createOwner()
          .then(r => r.createOrg())
          .then(r => r.createProject(ProjectType.Single));
        const { secret: readOnlyToken } = await createTargetAccessToken({
          mode: 'readOnly',
        });

        // Create a collection
        await expect(
          createDocumentCollection({
            name: 'My Collection',
            description: 'My favorite queries',
            token: readOnlyToken,
          }),
        ).rejects.toEqual(
          expect.objectContaining({
            message: expect.stringContaining(
              `No access (reason: "Missing permission for performing 'laboratory:createCollection' on resource")`,
            ),
          }),
        );
      });

      it('Prevent updating collection without the write permission to the target', async () => {
        const { createDocumentCollection, updateDocumentCollection, createTargetAccessToken } =
          await initSeed()
            .createOwner()
            .then(r => r.createOrg())
            .then(r => r.createProject(ProjectType.Single));

        const createResult = await createDocumentCollection({
          name: 'My Collection',
          description: 'My favorite queries',
        });

        const { secret: readOnlyToken } = await createTargetAccessToken({
          mode: 'readOnly',
        });

        await expect(
          updateDocumentCollection({
            collectionId: createResult.ok?.collection.id!,
            token: readOnlyToken,
            name: 'My Collection',
            description: 'My favorite queries',
          }),
        ).rejects.toEqual(
          expect.objectContaining({
            message: expect.stringContaining(
              `No access (reason: "Missing permission for performing 'laboratory:modifyCollection' on resource")`,
            ),
          }),
        );
      });

      it('Prevent deleting collection without the write permission to the target', async () => {
        const { createDocumentCollection, deleteDocumentCollection, createTargetAccessToken } =
          await initSeed()
            .createOwner()
            .then(r => r.createOrg())
            .then(r => r.createProject(ProjectType.Single));

        const createResult = await createDocumentCollection({
          name: 'My Collection',
          description: 'My favorite queries',
        });

        const { secret: readOnlyToken } = await createTargetAccessToken({
          mode: 'readOnly',
        });

        await expect(
          deleteDocumentCollection({
            collectionId: createResult.ok?.collection.id!,
            token: readOnlyToken,
          }),
        ).rejects.toEqual(
          expect.objectContaining({
            message: expect.stringContaining(
              `No access (reason: "Missing permission for performing 'laboratory:deleteCollection' on resource")`,
            ),
          }),
        );
      });
    });
  });
});
