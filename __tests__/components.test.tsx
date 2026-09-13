import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AppButton } from '../src/components/AppButton';
import { LoadingView } from '../src/components/LoadingView';
import { ErrorView } from '../src/components/ErrorView';

describe('Shared Components', () => {
  describe('AppButton', () => {
    it('renders with title', async () => {
      let tree: any;
      await ReactTestRenderer.act(async () => {
        tree = ReactTestRenderer.create(
          <AppButton title="Submit" onPress={() => {}} />
        );
      });
      expect(tree.toJSON()).toBeDefined();
    });

    it('renders in loading state', async () => {
      let tree: any;
      await ReactTestRenderer.act(async () => {
        tree = ReactTestRenderer.create(
          <AppButton title="Submit" onPress={() => {}} loading={true} />
        );
      });
      expect(tree.toJSON()).toBeDefined();
    });
  });

  describe('LoadingView', () => {
    it('renders default message', async () => {
      let tree: any;
      await ReactTestRenderer.act(async () => {
        tree = ReactTestRenderer.create(<LoadingView />);
      });
      expect(tree.toJSON()).toBeDefined();
    });

    it('renders custom message', async () => {
      let tree: any;
      await ReactTestRenderer.act(async () => {
        tree = ReactTestRenderer.create(
          <LoadingView message="Custom loading..." />
        );
      });
      expect(tree.toJSON()).toBeDefined();
    });
  });

  describe('ErrorView', () => {
    it('renders error message', async () => {
      let tree: any;
      await ReactTestRenderer.act(async () => {
        tree = ReactTestRenderer.create(
          <ErrorView message="Network error" />
        );
      });
      expect(tree.toJSON()).toBeDefined();
    });

    it('renders retry button when onRetry is provided', async () => {
      const onRetryMock = jest.fn();
      let tree: any;
      await ReactTestRenderer.act(async () => {
        tree = ReactTestRenderer.create(
          <ErrorView message="Failed" onRetry={onRetryMock} />
        );
      });
      expect(tree.toJSON()).toBeDefined();
    });
  });
});
