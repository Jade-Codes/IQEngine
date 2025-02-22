import { DataSourceClient } from './datasource-client';
import { DataSource } from '@/api/Models';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';
import { TraceabilityOrigin, Track } from '@/utils/sigmfMetadata';

export class LocalClient implements DataSourceClient {
  files: FileWithDirectoryAndFileHandle[];

  constructor(files: FileWithDirectoryAndFileHandle[]) {
    this.files = files;
  }
  sync(account: string, container: string): Promise<void> {
    throw new Error('sync not supported for local data sources');
  }
  query(querystring: string, signal: AbortSignal): Promise<TraceabilityOrigin[]> {
    throw new Error('query not supported for blob data sources');
  }
  getSasToken(account: string, container: string, filepath: string): Promise<String> {
    throw new Error('get sas token not supported for local data sources');
  }

  list(): Promise<DataSource[]> {
    const localDirectory: FileWithDirectoryAndFileHandle[] = this.files;
    if (!localDirectory) {
      return Promise.reject('No local directory found');
    }
    let directory = localDirectory[0];
    return Promise.resolve([
      {
        name: directory.name,
        account: 'local',
        container: directory.webkitRelativePath.split('/')[0],
        description: directory.name,
      } as DataSource,
    ]);
  }

  get(account: string, container: string): Promise<DataSource> {
    const localDirectory: FileWithDirectoryAndFileHandle[] = this.files;
    if (!localDirectory) {
      return Promise.reject('No local directory found');
    }
    return Promise.resolve({
      name: container,
      account: account,
      container: container,
      description: container,
    } as DataSource);
  }

  create(dataSource: DataSource): Promise<DataSource> {
    return Promise.reject('Not implemented');
  }

  update(dataSource: DataSource): Promise<DataSource> {
    return Promise.reject('Not implemented');
  }

  features() {
    return {
      updateMeta: false,
      sync: false,
      query: false,
    };
  }
}
