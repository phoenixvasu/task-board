import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoardStore } from '../store/useBoardStore';
import BoardColumns from '../components/board/BoardColumns';
import Button from '../components/ui/Button';
import { ChevronLeft, SortAsc, SortDesc, Calendar } from 'lucide-react';
import Dropdown from '../components/ui/Dropdown';
import { useSearchStore } from '../store/useSearchStore';

const BoardDetail: React.FC = () => {
  const { boardId } = useParams();
  const { getBoard, users } = useBoardStore();
  const board = getBoard(boardId!);
  const navigate = useNavigate();
  const [priority, setPriority] = useState('');
  const [assignee, setAssignee] = useState('');
  const [sort, setSort] = useState<'priority'|'dueDate'|'createdAt'|'title'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const { searchTerm, setPage } = useSearchStore();

  useEffect(() => {
    setPage('tasks');
    // Optionally reset();
  }, [setPage]);

  if (!board) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Calendar size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Loading board...</h2>
        <Button variant="primary" onClick={() => navigate('/')}>Back to Boards</Button>
      </div>
    );
  }

  return (
    <div className="max-w-full px-4 py-6 mx-auto dark:bg-darkbg min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={18} />} onClick={() => navigate('/')}>Boards</Button>
          <h1 className="text-2xl font-bold dark:text-white">{board.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Dropdown
            options={[{value:'',label:'All Priorities'},{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}]}
            value={priority}
            onChange={setPriority}
            placeholder="Priority"
          />
          <Dropdown
            options={[{value:'',label:'All Assignees'},...users.map(u=>({value:u.id,label:u.name}))]}
            value={assignee}
            onChange={setAssignee}
            placeholder="Assignee"
          />
          <Dropdown
            options={[
              {value:'createdAt',label:'Created'},
              {value:'priority',label:'Priority'},
              {value:'dueDate',label:'Due Date'},
              {value:'title',label:'Title'}
            ]}
            value={sort}
            onChange={val=>setSort(val as any)}
            placeholder="Sort by"
          />
          <Button variant="ghost" size="sm" icon={sortDir==='asc'?<SortAsc size={16}/>:<SortDesc size={16}/>} onClick={()=>setSortDir(d=>d==='asc'?'desc':'asc')}>
            {sortDir==='asc'?'Asc':'Desc'}
          </Button>
        </div>
      </div>
      {/* Columns and Tasks */}
      <BoardColumns boardId={boardId!} search={searchTerm} />
    </div>
  );
};

export default BoardDetail; 