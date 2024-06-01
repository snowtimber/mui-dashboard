import React, { useState } from 'react';
import axios from 'axios';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import Checkbox from '@mui/material/Checkbox';

interface GithubFile {
  id: string;
  label: string;
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: GithubFile[];
}

const GithubRepoExplorer = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [repoData, setRepoData] = useState<GithubFile[] | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [accessToken, setAccessToken] = useState('');

  const fetchRepoData = async (url: string) => {
    try {
      // First, try an unauthenticated request
      let response = await axios.get<GithubFile[]>(
        `https://api.github.com/repos/${url.replace('https://github.com/', '')}/contents`
      );

      const repoDataWithId = response.data.map((file) => ({
        ...file,
        id: file.path,
        label: file.name,
      }));
      setRepoData(repoDataWithId);
    } catch (error) {
      // If the unauthenticated request fails with a 403 Forbidden error
      if (error.response && error.response.status === 403) {
        try {
          // Retry with the access token
          const response = await axios.get<GithubFile[]>(
            `https://api.github.com/repos/${url.replace('https://github.com/', '')}/contents`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const repoDataWithId = response.data.map((file) => ({
            ...file,
            id: file.path,
            label: file.name,
          }));
          setRepoData(repoDataWithId);
        } catch (error) {
          console.error('Error fetching repository data with access token:', error);
        }
      } else {
        console.error('Error fetching repository data:', error);
      }
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRepoUrl(event.target.value);
  };

  const handleAccessTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAccessToken(event.target.value);
  };

  const handleSelectedItemsChange = (newSelectedItems: string[]) => {
    setSelectedItems(newSelectedItems);
  };

  const getSubdirectories = (data: GithubFile[], parentPath: string): string[] => {
    let subdirectories: string[] = [];
    for (const item of data) {
      if (item.type === 'dir' && item.path.startsWith(parentPath + '/')) {
        subdirectories.push(item.path);
        subdirectories = [...subdirectories, ...getSubdirectories(data, item.path)];
      }
    }
    return subdirectories;
  };

  const renderTreeItem = (node: GithubFile) => (
    <TreeItem
      key={node.id} // Add the key prop here
      itemId={node.id}
      label={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Checkbox
            checked={selectedItems.includes(node.id)}
            onChange={(event) => {
              const isChecked = event.target.checked;
              const updatedItems = isChecked
                ? [...selectedItems, node.id, ...getSubdirectories(repoData || [], node.id)]
                : selectedItems.filter((id) => id !== node.id);
              handleSelectedItemsChange(updatedItems);
            }}
          />
          {node.label}
        </div>
      }
    >
      {Array.isArray(node.children)
        ? node.children.map((childNode) => (
            <TreeItem
              key={childNode.id} // Add the key prop here for child components
              itemId={childNode.id}
              label={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Checkbox
                    checked={selectedItems.includes(childNode.id)}
                    onChange={(event) => {
                      const isChecked = event.target.checked;
                      const updatedItems = isChecked
                        ? [...selectedItems, childNode.id, ...getSubdirectories(repoData || [], childNode.id)]
                        : selectedItems.filter((id) => id !== childNode.id);
                      handleSelectedItemsChange(updatedItems);
                    }}
                  />
                  {childNode.label}
                </div>
              }
            >
              {Array.isArray(childNode.children)
                ? childNode.children.map((grandChildNode) => renderTreeItem(grandChildNode))
                : null}
            </TreeItem>
          ))
        : null}
    </TreeItem>
  );

  return (
    <div>
      <input type="text" value={repoUrl} onChange={handleUrlChange} placeholder="Enter GitHub repository URL" />
      <input type="text" value={accessToken} onChange={handleAccessTokenChange} placeholder="Enter GitHub access token" />
      <button onClick={() => fetchRepoData(repoUrl)}>Fetch Repository</button>
      {repoData && (
        <SimpleTreeView
          selectedItems={selectedItems}
          onSelectedItemsChange={handleSelectedItemsChange}
          multiSelect
        >
          {repoData.map((node) => renderTreeItem(node))}
        </SimpleTreeView>
      )}
      {selectedItems.length > 0 && (
        <div>
          <h3>Selected Items:</h3>
          <pre>{JSON.stringify(selectedItems, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default GithubRepoExplorer;