interface PathItem {
  _id?: string | object;
  name: string;
}

export const generatePath = (pathArray: PathItem[] = []): string => {
  const nestedDirectory = pathArray.length >= 2 ? pathArray.slice(1) : [];
  let path = "/root";
  nestedDirectory.forEach((dir) => {
    path += `/${dir.name}`;
  });
  return path;
};

export const generateBreadCrumb = (pathArray: PathItem[] = []): Array<{ _id?: string | object; name: string }> => {
  return pathArray.map((dir) => {
    return { _id: dir._id, name: dir.name };
  });
};
