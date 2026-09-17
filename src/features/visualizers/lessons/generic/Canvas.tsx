import type { GenericFrameData } from '../../core/types';

function displayScalar(value: unknown) {
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'undefined') return 'undefined';
  return String(value);
}

function ScalarArray({
  value,
  path,
  activePath,
}: {
  value: unknown[];
  path: Array<string | number>;
  activePath: Array<string | number>;
}) {
  return (
    <div className="generic-array">
      {value.map((item, index) => (
        <div
          className={
            activePath.length === path.length + 1 &&
            activePath.every((part, partIndex) =>
              partIndex < path.length ? part === path[partIndex] : part === index,
            )
              ? 'active'
              : ''
          }
          key={index}
        >
          <small>{index}</small>
          <b>{displayScalar(item)}</b>
        </div>
      ))}
    </div>
  );
}

function GenericValue({
  value,
  path,
  activePath,
}: {
  value: unknown;
  path: Array<string | number>;
  activePath: Array<string | number>;
}) {
  if (
    Array.isArray(value) &&
    value.every((item) => !Array.isArray(item) && !(item !== null && typeof item === 'object'))
  )
    return <ScalarArray value={value} path={path} activePath={activePath} />;
  if (Array.isArray(value) && value.every(Array.isArray))
    return (
      <div className="generic-matrix">
        {value.map((row, rowIndex) => (
          <ScalarArray
            value={row as unknown[]}
            path={[...path, rowIndex]}
            activePath={activePath}
            key={rowIndex}
          />
        ))}
      </div>
    );
  if (value !== null && typeof value === 'object')
    return (
      <div className="generic-object">
        {Object.entries(value as Record<string, unknown>).map(([key, item]) => {
          const prefixMatches = path.every((part, index) => activePath[index] === part);
          const isActive = prefixMatches && activePath[path.length] === key;
          return (
            <section className={isActive ? 'active' : ''} key={key}>
              <header>
                <span>{key}</span>
                <small>{Array.isArray(item) ? `array · ${item.length}` : typeof item}</small>
              </header>
              <GenericValue value={item} path={[...path, key]} activePath={activePath} />
            </section>
          );
        })}
      </div>
    );
  return (
    <div className={activePath.length === 0 ? 'generic-scalar active' : 'generic-scalar'}>
      <small>VALUE</small>
      <b>{displayScalar(value)}</b>
    </div>
  );
}

export function GenericCanvas({ data, approach }: { data: GenericFrameData; approach: string[] }) {
  return (
    <div className="generic-visual">
      <div className="generic-data-plane">
        <header>
          <span>PARAMETER MAP</span>
          <small>ARRAYS · MATRICES · OBJECTS · SCALARS</small>
        </header>
        <GenericValue value={data.value} path={[]} activePath={data.activePath} />
      </div>
      <div className="generic-flow-arrow">
        <i />
        <span>
          RECORDED
          <br />
          TRANSITIONS
        </span>
        <i />
      </div>
      <div className="approach-rail">
        {(approach.length ? approach : ['Inspect parameters and define the algorithm state.']).map(
          (message, index) => (
            <div
              className={
                index === data.transitionIndex
                  ? 'active'
                  : index < data.transitionIndex
                    ? 'complete'
                    : ''
              }
              key={`${message}-${index}`}
            >
              <i>{index + 1}</i>
              <span>{message}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
